import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { expect, test } from 'bun:test';

const modelPath = new URL('./src/teams-model.js', import.meta.url);
const context = vm.createContext({});
vm.runInContext(existsSync(modelPath) ? readFileSync(modelPath, 'utf8') : 'const TeamsModel = {};', context);
const TeamsModel = vm.runInContext('TeamsModel', context);
const collection = [{ id: 1, position: 'ST' }, { id: 2, position: 'GK' }, { id: 3, position: 'CM' }];
const slotIds = ['gk', 'lb', 'cb-left', 'cb-right', 'rb', 'cm-left', 'cdm', 'cm-right', 'lw', 'st', 'rw'];

test('creates independent empty 4-3-3 teams with fixed slot metadata', () => {
  expect(TeamsModel.formation).toBe('4-3-3');
  expect(Array.from(TeamsModel.slots, slot => slot.id)).toEqual(slotIds);
  expect(Array.from(TeamsModel.slots, slot => slot.position)).toEqual(['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CDM', 'CM', 'LW', 'ST', 'RW']);
  const first = TeamsModel.create(1, ' First XI ');
  expect(first).toEqual({ id: 1, name: 'First XI', formation: '4-3-3', slots: Object.fromEntries(slotIds.map(id => [id, null])) });
  first.slots.st = 9;
  expect(TeamsModel.create(2, 'Second XI').slots.st).toBeNull();
});

test('assigns any position, replaces the target, and moves the same card', () => {
  const team = TeamsModel.create(1, 'Club');
  expect(TeamsModel.assign(team, 'gk', 1, collection)).toBe(true);
  expect(team.slots.gk).toBe(1);
  expect(TeamsModel.assign(team, 'gk', 2, collection)).toBe(true);
  expect(team.slots.gk).toBe(2);
  expect(TeamsModel.assign(team, 'st', 2, collection)).toBe(true);
  expect(team.slots.gk).toBeNull();
  expect(team.slots.st).toBe(2);
});

test('rejects missing or invalid assignment references without changing the team', () => {
  const team = TeamsModel.create(1, 'Club');
  team.slots.st = 1;
  const before = JSON.stringify(team);
  for (const cardId of [0, -1, 1.5, '1', NaN, Infinity, undefined, 99]) {
    expect(TeamsModel.assign(team, 'st', cardId, collection)).toBe(false);
    expect(JSON.stringify(team)).toBe(before);
  }
  for (const slotId of ['unknown', '__proto__', 'constructor', null]) {
    expect(TeamsModel.assign(team, slotId, 2, collection)).toBe(false);
    expect(JSON.stringify(team)).toBe(before);
  }
  for (const invalidTeam of [null, {}, { slots: null }, { slots: [] }]) {
    expect(TeamsModel.assign(invalidTeam, 'st', 1, collection)).toBe(false);
  }
  expect(TeamsModel.assign(team, 'st', 1, [])).toBe(false);
  expect(TeamsModel.assign(team, 'st', 1, null)).toBe(false);
  expect(TeamsModel.assign(team, 'st', null, collection)).toBe(true);
  expect(team.slots.st).toBeNull();
});

test('normalizes a detached team using only fixed slots and first-slot duplicate priority', () => {
  const input = { id: 4, name: ' Club ', formation: 'unknown', extra: 1, slots: { st: 1, gk: 1, lb: 99, 'cb-left': '2', 'cb-right': 2, rb: -1, 'cm-left': 0, cdm: 1.5, 'cm-right': null, lw: 3, rw: undefined, unknown: 3 } };
  const before = JSON.stringify(input);
  const normalized = TeamsModel.normalize(input, collection);
  expect(normalized).toEqual({ id: 4, name: 'Club', formation: '4-3-3', slots: { gk: 1, lb: null, 'cb-left': null, 'cb-right': 2, rb: null, 'cm-left': null, cdm: null, 'cm-right': null, lw: 3, st: null, rw: null } });
  expect(JSON.stringify(input)).toBe(before);
  expect(normalized.slots).not.toBe(input.slots);
  expect(TeamsModel.normalize({ id: 1, name: 'Club' }, collection)).toEqual(TeamsModel.create(1, 'Club'));
  expect(TeamsModel.normalize(input, [])?.slots).toEqual(TeamsModel.create(4, 'Club').slots);
  expect(TeamsModel.normalize(input, null)?.slots).toEqual(TeamsModel.create(4, 'Club').slots);
  for (const invalid of [null, [], {}, { id: 0, name: 'Club' }, { id: '1', name: 'Club' }, { id: 1, name: '' }]) {
    expect(TeamsModel.normalize(invalid, collection)).toBeNull();
  }
});

test('reconciles missing and duplicate references in place independently per team', () => {
  const first = TeamsModel.create(1, 'First');
  const second = TeamsModel.create(2, 'Second');
  Object.assign(first.slots, { st: 1, gk: 1, lb: 99, rw: '2', cdm: 0 });
  Object.assign(second.slots, { gk: 1, st: 2, lw: 3 });
  const teams = [first, second];
  const firstSlots = first.slots;
  const collectionBefore = JSON.stringify(collection);
  TeamsModel.reconcile(teams, collection);
  expect(teams[0]).toBe(first);
  expect(first.slots).toBe(firstSlots);
  expect(first.slots.gk).toBe(1);
  for (const id of ['st', 'lb', 'rw', 'cdm']) expect(first.slots[id]).toBeNull();
  expect(second.slots.gk).toBe(1);
  expect(second.slots.st).toBe(2);
  expect(second.slots.lw).toBe(3);
  expect(JSON.stringify(collection)).toBe(collectionBefore);
  TeamsModel.reconcile(teams, [{ id: 1 }]);
  expect(second.slots.st).toBeNull();
  expect(second.slots.lw).toBeNull();
  const snapshot = JSON.stringify(teams);
  TeamsModel.reconcile(teams, [{ id: 1 }]);
  expect(JSON.stringify(teams)).toBe(snapshot);
  expect(() => TeamsModel.reconcile([null, {}], null)).not.toThrow();
  expect(() => TeamsModel.reconcile(null, collection)).not.toThrow();
});

test('validates trimmed names and positive integer team IDs without HTML processing', () => {
  expect(TeamsModel.validateName('  Club  ')).toBe('Club');
  expect(TeamsModel.validateName('x'.repeat(40))).toBe('x'.repeat(40));
  expect(TeamsModel.validateName('<b>Club</b>')).toBe('<b>Club</b>');
  for (const name of ['', '   ', 'x'.repeat(41), null, 7, {}]) {
    expect(TeamsModel.validateName(name)).toBeNull();
    expect(TeamsModel.create(1, name)).toBeNull();
  }
  for (const id of [0, -1, 1.5, '1', NaN, Infinity, null, undefined]) {
    expect(TeamsModel.create(id, 'Club')).toBeNull();
  }
});
