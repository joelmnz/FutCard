import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeAll, describe, expect, test } from 'bun:test';

const APP_SOURCE = readFileSync(new URL('./src/app.js', import.meta.url), 'utf8');

const OUTFIELD_POSITIONS = new Set(['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']);

function fakeElement() {
  const el = {
    innerHTML: '',
    textContent: '',
    value: '',
    style: {},
    dataset: {},
    offsetWidth: 0,
    className: '',
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
    addEventListener() {},
    appendChild(child) {
      return child;
    },
    remove() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getContext() {
      return null;
    },
  };
  el.parentElement = { classList: { add() {}, remove() {} }, offsetWidth: 0 };
  return el;
}

function makeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    _map: map,
  };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

function loadApp(storage) {
  const elementCache = new Map();
  const sandbox = {
    console: { error() {}, warn() {}, log() {} },
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
    setInterval() {
      return 0;
    },
    clearInterval() {},
    requestAnimationFrame() {
      return 0;
    },
    performance,
    navigator: {},
    window: {
      localStorage: storage,
      addEventListener() {},
      innerWidth: 800,
      innerHeight: 600,
    },
    document: {
      body: fakeElement(),
      getElementById(id) {
        if (!elementCache.has(id)) elementCache.set(id, fakeElement());
        return elementCache.get(id);
      },
      createElement() {
        return fakeElement();
      },
      querySelectorAll() {
        return [];
      },
      addEventListener() {},
    },
  };
  sandbox.__FUTCARD_TEST_HOOK__ = (api) => {
    sandbox.__futcardApi = api;
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(APP_SOURCE, context, { filename: 'app.js' });
  const api = sandbox.__futcardApi;
  if (!api) throw new Error('app.js did not register its test hook');
  return { api, sandbox };
}

function freshApp() {
  return loadApp(makeStorage());
}

let api;
let appCode;

beforeAll(() => {
  const { api: hooked } = freshApp();
  api = hooked;
  appCode = APP_SOURCE;
});

describe('roster integrity', () => {
  test('templates are complete, outfield-only and unique', () => {
    expect(api.TEMPLATES.length).toBeGreaterThanOrEqual(150);

    const names = new Set();
    for (const t of api.TEMPLATES) {
      expect(typeof t.name).toBe('string');
      expect(t.name.length).toBeGreaterThan(1);
      names.add(t.name);
      expect(typeof t.club).toBe('string');
      expect(t.club.length).toBeGreaterThan(1);
      expect(typeof t.nation).toBe('string');
      expect(t.nation.length).toBeGreaterThanOrEqual(2);
      expect(OUTFIELD_POSITIONS.has(t.position)).toBe(true);
      for (const stat of ['pace', 'shooting', 'passing', 'dribbling', 'defense']) {
        expect(Number.isInteger(t[stat])).toBe(true);
        expect(t[stat]).toBeGreaterThanOrEqual(25);
        expect(t[stat]).toBeLessThanOrEqual(96);
      }
    }
    expect(names.size).toBe(api.TEMPLATES.length);
  });

  test('no goalkeepers in the roster', () => {
    expect(api.TEMPLATES.some((t) => t.position === 'GK')).toBe(false);
  });

  test('overall derives from the five stats with position weights', () => {
    for (const t of api.TEMPLATES) {
      const weights = api.OVR_WEIGHTS[t.position];
      expect(weights).toBeDefined();
      let sum = 0;
      for (const [stat, weight] of Object.entries(weights)) sum += weight * t[stat];
      expect(t.overall).toBe(Math.round(sum));
      expect(t.rarity).toBe(api.rarityForOverall(t.overall));
      expect(t.basePrice).toBe(api.basePriceFor(t.overall));
    }
  });

  test('price is monotonic in overall and preserves the legacy bands', () => {
    let prevPrice = 0;
    let prevOverall = 0;
    for (const t of [...api.TEMPLATES].sort((a, b) => a.overall - b.overall)) {
      expect(t.basePrice).toBeGreaterThanOrEqual(prevPrice);
      if (t.overall > prevOverall) {
        expect(t.basePrice).toBeGreaterThanOrEqual(prevPrice);
      }
      prevPrice = t.basePrice;
      prevOverall = t.overall;
    }
    expect(api.basePriceFor(50)).toBe(1000);
    expect(api.basePriceFor(64)).toBe(15000);
    expect(api.basePriceFor(65)).toBe(15000);
    expect(api.basePriceFor(74)).toBe(80000);
    expect(api.basePriceFor(75)).toBe(80000);
    expect(api.basePriceFor(84)).toBe(500000);
    expect(api.basePriceFor(85)).toBe(500000);
    expect(api.basePriceFor(99)).toBe(2000000);
    for (let ovr = 50; ovr <= 99; ovr++) {
      expect(api.basePriceFor(ovr)).toBeGreaterThanOrEqual(api.basePriceFor(ovr - 1));
    }
  });

  test('every rarity tier is populated and strong players clearly differentiate', () => {
    const byTier = { legendary: [], epic: [], rare: [], common: [] };
    for (const t of api.TEMPLATES) byTier[t.rarity].push(t);
    expect(byTier.legendary.length).toBeGreaterThanOrEqual(5);
    expect(byTier.epic.length).toBeGreaterThanOrEqual(20);
    expect(byTier.rare.length).toBeGreaterThanOrEqual(20);
    expect(byTier.common.length).toBeGreaterThanOrEqual(20);

    const minLegendary = Math.min(...byTier.legendary.map((t) => t.overall));
    const maxCommon = Math.max(...byTier.common.map((t) => t.overall));
    expect(minLegendary - maxCommon).toBeGreaterThanOrEqual(20);

    const maxCommonPrice = Math.max(...byTier.common.map((t) => t.basePrice));
    const minLegendaryPrice = Math.min(...byTier.legendary.map((t) => t.basePrice));
    expect(minLegendaryPrice).toBeGreaterThan(maxCommonPrice);
  });

  test('roster covers many clubs and nations from the verified snapshot', () => {
    expect(new Set(api.TEMPLATES.map((t) => t.club)).size).toBeGreaterThanOrEqual(50);
    expect(new Set(api.TEMPLATES.map((t) => t.nation)).size).toBeGreaterThanOrEqual(30);
    expect(api.ROSTER_SEASON).toBe('2026/27');
    expect(api.ROSTER_AS_OF).toBe('2026-09-29');
  });
});

describe('generation across flows', () => {
  test('every generated card is bound to a roster template', () => {
    for (let i = 0; i < 200; i++) {
      const card = api.generatePlayer(10000 + i, i % 4 === 0 ? 'legendary' : null);
      const template = api.TEMPLATES.find((t) => t.name === card.name);
      expect(template).toBeDefined();
      expect(card.club).toBe(template.club);
      expect(card.nation).toBe(template.nation);
      expect(card.position).toBe(template.position);
      expect(card.overall).toBe(template.overall);
      expect(card.rarity).toBe(template.rarity);
      expect(card.basePrice).toBe(template.basePrice);
      expect(card.currentPrice).toBe(template.basePrice);
      expect(card.pace).toBe(template.pace);
      expect(card.shooting).toBe(template.shooting);
      expect(card.passing).toBe(template.passing);
      expect(card.dribbling).toBe(template.dribbling);
      expect(card.defense).toBe(template.defense);
    }
  });

  test('rarity override is honored', () => {
    for (let i = 0; i < 30; i++) {
      expect(api.generatePlayer(i, 'legendary').rarity).toBe('legendary');
      expect(api.generatePlayer(i, 'common').rarity).toBe('common');
    }
  });

  test('default rarity roll keeps legacy weights', () => {
    const counts = { legendary: 0, epic: 0, rare: 0, common: 0 };
    for (let i = 0; i < 2000; i++) counts[api.generatePlayer(i, null).rarity]++;
    expect(counts.legendary / 2000).toBeLessThan(0.08);
    expect(counts.legendary / 2000).toBeGreaterThan(0.02);
    expect(counts.epic / 2000).toBeGreaterThan(0.08);
    expect(counts.rare / 2000).toBeGreaterThan(0.18);
    expect(counts.common / 2000).toBeGreaterThan(0.5);
  });

  test('tier deck cycles through the whole tier before repeating', () => {
    const { api: fresh } = freshApp();
    const legendaries = api.TEMPLATES.filter((t) => t.rarity === 'legendary');
    const counts = new Map();
    const draws = legendaries.length * 4;
    for (let i = 0; i < draws; i++) {
      const name = fresh.pickTemplate('legendary').name;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    expect(counts.size).toBe(legendaries.length);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  test('market, bots and starter squads generate correctly', () => {
    const { api: fresh } = freshApp();
    expect(fresh.state.market.length).toBe(120);
    expect(fresh.state.market.every((c) => c.listed && c.listPrice === c.currentPrice)).toBe(true);
    expect(fresh.state.bots.length).toBe(4);
    expect(fresh.state.bots.every((b) => b.cards.length === 20)).toBe(true);
    expect(fresh.state.collection.length).toBe(10);
    expect(fresh.state.collection.filter((c) => c.rarity === 'rare').length).toBe(2);
    expect(fresh.state.collection.filter((c) => c.rarity === 'common').length).toBe(8);
    expect(fresh.state.market.every((c) => c.position !== 'GK')).toBe(true);
  });

  test('bronze pack honors weights and pack flow adds cards to collection', () => {
    const { api: fresh } = freshApp();
    const startCoins = fresh.state.coins;
    const rarities = [];
    for (let i = 0; i < 50; i++) {
      fresh.openPack('bronze');
      fresh.closePack();
      const added = fresh.state.collection.slice(-5);
      rarities.push(...added.map((c) => c.rarity));
      expect(added.length).toBe(5);
    }
    expect(fresh.state.coins).toBe(startCoins - 50 * 5000);
    expect(rarities.filter((r) => r === 'legendary').length).toBe(0);
    expect(rarities.filter((r) => r === 'common').length / rarities.length).toBeGreaterThan(0.6);
  });

  test('pack costs, counts and weights are preserved', () => {
    expect(api.PACK_CONFIG).toEqual({
      bronze: { cost: 5000, count: 5, name: 'Bronze Pack', weights: { common: 75, rare: 20, epic: 5, legendary: 0 } },
      silver: { cost: 15000, count: 7, name: 'Silver Pack', weights: { common: 35, rare: 50, epic: 15, legendary: 0 } },
      gold: { cost: 35000, count: 8, name: 'Gold Pack', weights: { common: 10, rare: 50, epic: 30, legendary: 10 } },
      elite: { cost: 100000, count: 10, name: 'Elite Pack', weights: { common: 0, rare: 15, epic: 50, legendary: 35 } },
      ultimate: { cost: 250000, count: 12, name: 'Ultimate Pack', weights: { common: 0, rare: 10, epic: 45, legendary: 45 } },
    });
  });

  test('market buy keeps the market full', () => {
    const { api: fresh } = freshApp();
    const before = fresh.state.market.length;
    const card = fresh.state.market[0];
    fresh.state.coins = Math.max(fresh.state.coins, card.listPrice);
    fresh.buyCard(card.id);
    expect(fresh.state.collection.some((c) => c.id === card.id)).toBe(true);
    expect(fresh.state.market.length).toBe(before);
    expect(fresh.state.market.some((c) => c.id === card.id)).toBe(false);
    expect(fresh.state.marketBuys).toBe(1);
  });
});

describe('save roundtrip', () => {
  test('state survives a reload with identical card data', () => {
    const storage = makeStorage();
    const first = loadApp(storage);
    const savedBefore = JSON.parse(storage.getItem('futcard-save-v1'));
    expect(savedBefore.version).toBe(1);
    expect(savedBefore.collection.length).toBe(10);
    expect(savedBefore.market.length).toBe(120);
    expect(savedBefore.bots.length).toBe(4);

    const second = loadApp(storage);
    const after = second.api.state;
    expect(after.collection.length).toBe(10);
    expect(after.market.length).toBe(120);
    expect(after.bots.length).toBe(4);
    expect(after.nextId).toBe(first.api.state.nextId);
    expect(JSON.stringify(canonical(after.collection))).toBe(JSON.stringify(canonical(first.api.state.collection)));
    expect(JSON.stringify(canonical(after.market))).toBe(JSON.stringify(canonical(first.api.state.market)));
    expect(JSON.stringify(canonical(after.bots))).toBe(JSON.stringify(canonical(first.api.state.bots)));

    // A second reload is byte-stable once normalized once.
    second.api.saveState();
    const savedAfter = storage.getItem('futcard-save-v1');
    const third = loadApp(storage);
    third.api.saveState();
    expect(storage.getItem('futcard-save-v1')).toBe(savedAfter);
    expect(JSON.stringify(canonical(third.api.state.bots))).toBe(JSON.stringify(canonical(after.bots)));
  });

  test('saved v1 cards, including legacy goalkeepers, load unchanged', () => {
    const storage = makeStorage();
    const gkCard = {
      id: 501,
      name: 'Legacy Keeper',
      club: 'Ajax',
      nation: '🇳🇱',
      position: 'GK',
      emoji: '🧑',
      rarity: 'rare',
      overall: 72,
      pace: 60, shooting: 30, passing: 55, dribbling: 50, defense: 80,
      basePrice: 30000,
      currentPrice: 31000,
      priceHistory: [30000, 31000],
      listed: false,
      listPrice: 0
    };
    const oldRandomCard = {
      id: 502,
      name: 'Jack Smith',
      club: 'West Ham',
      nation: '🏴',
      position: 'ST',
      emoji: '👨',
      rarity: 'common',
      overall: 58,
      pace: 61, shooting: 57, passing: 52, dribbling: 60, defense: 44,
      basePrice: 5000,
      currentPrice: 5200,
      priceHistory: [5000, 5200],
      listed: false,
      listPrice: 0
    };
    storage.setItem('futcard-save-v1', JSON.stringify({
      version: 1,
      coins: 777,
      collection: [gkCard, oldRandomCard],
      nextId: 503,
      selectedBot: 0,
      collectionFilter: 'all',
      collectionSort: 'overall',
      packsOpened: 3,
      marketBuys: 1,
      tradesAccepted: 2,
      pendingPackCards: []
    }));

    const { api: loaded } = loadApp(storage);
    const state = loaded.state;
    expect(state.coins).toBe(777);
    const keeper = state.collection.find((c) => c.id === 501);
    expect(keeper).toEqual({ ...gkCard, listPrice: 0 });
    const legacy = state.collection.find((c) => c.id === 502);
    expect(legacy.name).toBe('Jack Smith');
    expect(legacy.position).toBe('ST');
    expect(state.market.length).toBe(120);
    expect(state.bots.length).toBe(4);
    expect(state.market.every((c) => c.position !== 'GK')).toBe(true);
  });

  test('corrupt card fields fall back without crashing', () => {
    const normalized = api.normalizeCard({
      id: 9,
      rarity: 'rare',
      overall: 66,
      pace: 66, shooting: 66, passing: 66, dribbling: 66, defense: 66,
      basePrice: 20000,
      currentPrice: 20000,
      priceHistory: [20000]
    });
    expect(typeof normalized.name).toBe('string');
    expect(normalized.club).toBeTypeOf('string');
    expect(normalized.club.length).toBeGreaterThan(1);
    expect(normalized.position).toBe('CM');
    expect(normalized.nation.length).toBeGreaterThanOrEqual(1);
  });

  test('pending pack cards are recovered into the collection', () => {
    const { api: source } = freshApp();
    source.openPack('bronze');
    const saved = source.buildSaveData();
    const storage = makeStorage();
    storage.setItem('futcard-save-v1', JSON.stringify({
      ...saved,
      collection: [],
      pendingPackCards: saved.pendingPackCards
    }));
    const { api: loaded } = loadApp(storage);
    expect(loaded.state.collection.length).toBe(5);
  });
});

describe('offline purity', () => {
  test('app.js makes no network calls and loads only local assets', () => {
    expect(APP_SOURCE).not.toMatch(/\bfetch\s*\(/);
    expect(APP_SOURCE).not.toMatch(/XMLHttpRequest/);
    expect(APP_SOURCE).not.toMatch(/WebSocket|EventSource/);
    expect(APP_SOURCE).not.toMatch(/\bimport\s*\(/);
    expect(APP_SOURCE).not.toMatch(/https?:\/\//);
  });
});