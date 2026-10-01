import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { expect, test } from 'bun:test';

function app() {
  const storage = new Map();
  const el = () => ({ innerHTML: '', textContent: '', value: '', style: {}, parentElement: { classList: { add() {}, remove() {} }, offsetWidth: 0 }, classList: { add() {}, remove() {}, contains() { return false; } }, addEventListener() {}, appendChild() {}, remove() {}, querySelectorAll() { return []; } });
  let api;
  const context = vm.createContext({
    console, setTimeout() {}, setInterval() {}, requestAnimationFrame() {}, navigator: {},
    window: { localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) }, addEventListener() {}, confirm() { return true; } },
    document: { getElementById: el, querySelectorAll: () => [], createElement: el, body: el() },
    __FUTCARD_TEST_HOOK__: value => { api = value; }
  });
  for (const file of ['data/reference.js', 'data/roster.js', 'teams-model.js', 'teams-ui.js', 'app.js']) {
    if (existsSync(`src/${file}`)) vm.runInContext(readFileSync(`src/${file}`, 'utf8'), context);
  }
  return { api, storage, context };
}

test('removing an owned card clears its assignments but preserves other cards', () => {
  const { api } = app();
  const [first, second] = api.state.collection;
  api.state.teams = [{ id: 1, name: 'Club', formation: '4-3-3', slots: { gk: first.id, st: second.id } }];
  api.removeCollectionCards([first.id]);
  expect(api.state.collection.some(card => card.id === first.id)).toBe(false);
  expect(api.state.teams[0].slots.gk).toBeNull();
  expect(api.state.teams[0].slots.st).toBe(second.id);
});

test('teams survive reload and malformed references are repaired', () => {
  const { api, storage } = app();
  const card = api.state.collection[0];
  api.state.teams = [{ id: 8, name: 'Saved XI', formation: '4-3-3', slots: { gk: card.id, st: card.id, lw: 999999 } }];
  expect(api.saveState()).toBe(true);
  expect(api.loadState()).toBe(true);
  expect(api.state.teams[0].slots.gk).toBe(card.id);
  expect(api.state.teams[0].slots.st).toBeNull();
  expect(api.state.teams[0].slots.lw).toBeNull();
  expect(api.state.nextTeamId).toBe(9);
  expect(JSON.parse(storage.get('futcard-save-v1')).teams[0].name).toBe('Saved XI');
});

test('legacy saves migrate to an empty team library without changing card ownership', () => {
  const { api, storage } = app();
  const save = api.buildSaveData();
  delete save.teams;
  delete save.nextTeamId;
  save.version = 1;
  storage.set('futcard-save-v1', JSON.stringify(save));
  expect(api.loadState()).toBe(true);
  expect(api.state.teams).toEqual([]);
  expect(api.state.nextTeamId).toBe(1);
  expect(api.buildSaveData().version).toBe(2);
  expect(api.state.collection.length).toBe(save.collection.length);
});
