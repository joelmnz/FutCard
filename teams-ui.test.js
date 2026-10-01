import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, test } from 'bun:test';

function setup() {
  const listeners = {};
  let html = '', teams = [], collection = [
    { id: 10, name: 'One', position: 'ST', overall: 80, rarity: 'rare', club: 'Club', nation: 'England' },
    { id: 11, name: 'Two', position: 'GK', overall: 81, rarity: 'epic', club: 'Other', nation: 'Spain' }
  ];
  let successful = true, confirmed = true;
  const root = { addEventListener(n, f, capture) { if (!capture) listeners[n] = f; },
    get innerHTML() { return html; }, set innerHTML(v) { html = v; },
    querySelector: () => null, querySelectorAll: () => [], contains: () => true };
  const context = vm.createContext({ document: { getElementById: () => root }, window: { addEventListener() {}, confirm: () => confirmed } });
  for (const file of ['teams-model', 'teams-ui']) vm.runInContext(readFileSync(`src/${file}.js`, 'utf8'), context);
  const ui = vm.runInContext('TeamsUI', context);
  let id = 1;
  ui.init({ getCollection: () => collection, getTeams: () => teams, nextId: () => id++, save: () => successful,
    buildCardHTML: card => `<div class="card">${card.name}</div>`, toast() {} });
  ui.render();
  return { ui, teams, get html() { return html; },
    set successful(value) { successful = value; }, set confirmed(value) { confirmed = value; },
    set collection(value) { collection = value; },
    click(action, extra = {}) { const target = { dataset: { action, ...extra }, closest: () => target }; listeners.click({ target }); },
    input(field, value) { listeners.input({ target: { dataset: { field }, value } }); }
  };
}

test('library saves isolated drafts, escapes names, and confirms deletion', () => {
  const s = setup();
  s.click('create'); s.input('name', '<img src=x>');
  expect(s.teams).toHaveLength(0);
  s.confirmed = false; expect(s.ui.canLeave()).toBe(false);
  s.confirmed = true; s.click('save');
  expect(s.teams[0].name).toBe('<img src=x>');
  expect(s.html).toContain('&lt;img src=x&gt;');
  s.click('edit', { team: '1' }); s.input('name', 'Changed');
  expect(s.teams[0].name).toBe('<img src=x>');
  s.click('cancel'); expect(s.teams[0].name).toBe('<img src=x>');
  s.confirmed = false; s.click('delete', { team: '1' }); expect(s.teams).toHaveLength(1);
  s.confirmed = true; s.click('delete', { team: '1' }); expect(s.teams).toHaveLength(0);
});

test('sidebar searches nations and sorts cards by overall', () => {
  const s = setup(); s.click('create');
  expect(s.html.indexOf('data-action="select" data-card="11"')).toBeLessThan(s.html.indexOf('data-action="select" data-card="10"'));
  s.input('search', 'Spain'); s.ui.render();
  expect(s.html).toContain('data-action="select" data-card="11"');
  expect(s.html).not.toContain('data-action="select" data-card="10"');
});

test('placement moves and replaces any position while failed saves preserve the draft', () => {
  const s = setup(); s.click('create');
  s.click('select', { card: '10' }); s.click('slot', { slot: 'st' });
  s.click('select', { card: '10' }); s.click('slot', { slot: 'gk' });
  expect(s.html).toContain('data-slot="gk" data-card="10"');
  expect(s.html).not.toContain('data-slot="st" data-card="10"');
  s.click('select', { card: '11' }); s.click('slot', { slot: 'gk' });
  s.successful = false; s.click('save'); expect(s.teams).toHaveLength(0);
  s.successful = true; s.click('save'); expect(s.teams[0].slots.gk).toBe(11);
  expect(s.teams[0].slots.st).toBeNull();
  s.click('edit', { team: '1' }); s.collection = []; s.ui.reconcileDraft(); s.ui.render();
  s.click('save'); expect(s.teams[0].slots.gk).toBeNull();
});
