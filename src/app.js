// ============================================================
// DATA — PLAYERS
// ============================================================
const PLAYER_EMOJIS = ['🧑','👨','👦','🧔','👱','🧑‍🦱','🧑‍🦰','🧑‍🦳'];
const POSITIONS = ['GK','CB','CB','LB','RB','CDM','CM','CM','CAM','LW','RW','ST','ST','CF'];
const CLUBS = [
  'Manchester City','Arsenal','Liverpool','Chelsea','Manchester United',
  'Tottenham','Newcastle','Aston Villa','Brighton','West Ham',
  'Real Madrid','Barcelona','Bayern Munich','PSG','Juventus',
  'Atletico Madrid','Dortmund','Inter Milan','AC Milan','Ajax'
];
const NATIONS = ['🏴','🇧🇷','🇦🇷','🇫🇷','🇩🇪','🇵🇹','🇳🇱','🇧🇪','🇪🇸','🇮🇹','🇸🇳','🇳🇬','🇺🇾','🇨🇴','🇲🇦'];

const FIRST_NAMES = [
  'Liam','Noah','Oliver','James','Elijah','Lucas','Mason','Ethan','Aiden','Logan',
  'Carlos','Diego','Marco','Rafael','Bruno','Sergio','Antoine','Kylian','Erling','Vinicius',
  'Mohamed','Sadio','Riyad','Kevin','Joshua','Trent','Declan','Jude','Phil','Bukayo',
  'Harry','Marcus','Raheem','Jack','Jordan','Kieran','Luke','Ben','Aaron','Kalvin',
  'Lautaro','Romelu','Tammy','Olivier','Karim','Robert','Thomas','Leon','Leroy','Jamal'
];
const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Martinez','Davis','Wilson','Taylor',
  'Salah','Mane','Mahrez','De Bruyne','Walker','Alexander-Arnold','Rice','Bellingham','Foden','Saka',
  'Kane','Rashford','Sterling','Grealish','Henderson','Trippier','Shaw','White','Ramsdale','Phillips',
  'Martinez','Lukaku','Abraham','Giroud','Benzema','Lewandowski','Muller','Goretzka','Gnabry','Musiala',
  'Silva','Neymar','Mbappe','Griezmann','Pogba','Kante','Varane','Hernandez','Pavard','Dembele'
];

function randName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + ' ' +
         LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

function generatePlayer(id, rarityOverride) {
  const rarityRoll = Math.random();
  let rarity = rarityOverride;
  if (!rarity) {
    if (rarityRoll < 0.05) rarity = 'legendary';
    else if (rarityRoll < 0.18) rarity = 'epic';
    else if (rarityRoll < 0.42) rarity = 'rare';
    else rarity = 'common';
  }

  const baseStats = {
    legendary: { min: 85, max: 99 },
    epic: { min: 75, max: 88 },
    rare: { min: 65, max: 78 },
    common: { min: 50, max: 68 }
  }[rarity];

  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pace = r(baseStats.min, baseStats.max);
  const shooting = r(baseStats.min, baseStats.max);
  const passing = r(baseStats.min, baseStats.max);
  const dribbling = r(baseStats.min, baseStats.max);
  const defense = r(baseStats.min, baseStats.max);
  const overall = Math.round((pace + shooting + passing + dribbling + defense) / 5);

  const basePrice = {
    legendary: r(500000, 2000000),
    epic: r(80000, 500000),
    rare: r(15000, 80000),
    common: r(1000, 15000)
  }[rarity];

  return {
    id,
    name: randName(),
    club: CLUBS[Math.floor(Math.random() * CLUBS.length)],
    nation: NATIONS[Math.floor(Math.random() * NATIONS.length)],
    position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
    emoji: PLAYER_EMOJIS[Math.floor(Math.random() * PLAYER_EMOJIS.length)],
    rarity,
    overall,
    pace, shooting, passing, dribbling, defense,
    basePrice,
    currentPrice: basePrice,
    priceHistory: [basePrice],
    listed: false,
    listPrice: 0
  };
}

// ============================================================
// GAME STATE
// ============================================================
function createInitialState() {
  return {
    coins: 1000000,
    collection: [],
    market: [],
    nextId: 1,
    bots: [],
    selectedBot: 0,
    yourTradeCards: [],
    botTradeCards: [],
    sellCardId: null,
    collectionFilter: 'all',
    collectionSort: 'overall'
  };
}

let state = createInitialState();

const SAVE_KEY = 'futcard-save-v1';
const VALID_COLLECTION_FILTERS = new Set(['all', 'legendary', 'epic', 'rare', 'common']);
const VALID_COLLECTION_SORTS = new Set(['overall', 'rarity', 'price']);

let pendingPackCards = [];
let recoveredPackCards = 0;
let storageAvailable;
let storageErrorShown = false;

function hasStorageAccess() {
  if (typeof storageAvailable === 'boolean') return storageAvailable;

  try {
    const testKey = '__futcard_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }

  return storageAvailable;
}

function normalizeCard(card) {
  if (!card || typeof card !== 'object') return null;

  const priceHistory = Array.isArray(card.priceHistory)
    ? card.priceHistory.filter((price) => Number.isFinite(price)).slice(-20)
    : [];
  const basePrice = Number.isFinite(card.basePrice) ? Math.round(card.basePrice) : 1000;
  const currentPrice = Number.isFinite(card.currentPrice) ? Math.round(card.currentPrice) : basePrice;

  return {
    id: Number.isInteger(card.id) ? card.id : 0,
    name: typeof card.name === 'string' ? card.name : randName(),
    club: typeof card.club === 'string' ? card.club : CLUBS[0],
    nation: typeof card.nation === 'string' ? card.nation : NATIONS[0],
    position: typeof card.position === 'string' ? card.position : POSITIONS[0],
    emoji: typeof card.emoji === 'string' ? card.emoji : PLAYER_EMOJIS[0],
    rarity: ['legendary', 'epic', 'rare', 'common'].includes(card.rarity) ? card.rarity : 'common',
    overall: Number.isFinite(card.overall) ? Math.round(card.overall) : 50,
    pace: Number.isFinite(card.pace) ? Math.round(card.pace) : 50,
    shooting: Number.isFinite(card.shooting) ? Math.round(card.shooting) : 50,
    passing: Number.isFinite(card.passing) ? Math.round(card.passing) : 50,
    dribbling: Number.isFinite(card.dribbling) ? Math.round(card.dribbling) : 50,
    defense: Number.isFinite(card.defense) ? Math.round(card.defense) : 50,
    basePrice,
    currentPrice,
    priceHistory: priceHistory.length > 0 ? priceHistory : [currentPrice],
    listed: Boolean(card.listed),
    listPrice: Number.isFinite(card.listPrice) ? Math.max(0, Math.round(card.listPrice)) : 0
  };
}

function normalizeBot(bot, index) {
  if (!bot || typeof bot !== 'object') return null;

  return {
    id: Number.isInteger(bot.id) ? bot.id : index,
    name: typeof bot.name === 'string' ? bot.name : `Bot ${index + 1}`,
    emoji: typeof bot.emoji === 'string' ? bot.emoji : '🤖',
    style: ['fair', 'greedy', 'generous', 'elite'].includes(bot.style) ? bot.style : 'fair',
    cards: Array.isArray(bot.cards) ? bot.cards.map(normalizeCard).filter(Boolean) : []
  };
}

function buildSaveData() {
  return {
    version: 1,
    coins: state.coins,
    collection: state.collection,
    market: state.market,
    nextId: state.nextId,
    bots: state.bots,
    selectedBot: state.selectedBot,
    collectionFilter: state.collectionFilter,
    collectionSort: state.collectionSort,
    pendingPackCards
  };
}

function saveState() {
  if (!hasStorageAccess()) return false;

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData()));
    storageErrorShown = false;
    return true;
  } catch (error) {
    console.error('Failed to save FutCard state.', error);
    if (!storageErrorShown && document.getElementById('toast-container')) {
      showToast('⚠️ Could not save progress in this browser session.', 'warning');
      storageErrorShown = true;
    }
    return false;
  }
}

function loadState() {
  if (!hasStorageAccess()) return false;

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;

    const nextState = createInitialState();
    nextState.coins = Number.isFinite(parsed.coins) ? Math.max(0, Math.round(parsed.coins)) : nextState.coins;
    nextState.collection = Array.isArray(parsed.collection) ? parsed.collection.map(normalizeCard).filter(Boolean) : [];
    nextState.market = Array.isArray(parsed.market) ? parsed.market.map(normalizeCard).filter(Boolean) : [];
    nextState.bots = Array.isArray(parsed.bots) ? parsed.bots.map(normalizeBot).filter(Boolean) : [];
    nextState.nextId = Number.isInteger(parsed.nextId) ? parsed.nextId : nextState.nextId;
    nextState.selectedBot = Number.isInteger(parsed.selectedBot) ? parsed.selectedBot : nextState.selectedBot;
    nextState.collectionFilter = VALID_COLLECTION_FILTERS.has(parsed.collectionFilter)
      ? parsed.collectionFilter
      : nextState.collectionFilter;
    nextState.collectionSort = VALID_COLLECTION_SORTS.has(parsed.collectionSort)
      ? parsed.collectionSort
      : nextState.collectionSort;

    if (nextState.market.length === 0 || nextState.bots.length === 0) return false;

    const recovered = Array.isArray(parsed.pendingPackCards)
      ? parsed.pendingPackCards.map(normalizeCard).filter(Boolean)
      : [];

    recoveredPackCards = recovered.length;
    if (recovered.length > 0) {
      nextState.collection.push(...recovered);
    }

    const allCards = [
      ...nextState.collection,
      ...nextState.market,
      ...nextState.bots.flatMap((bot) => bot.cards)
    ];
    const maxCardId = allCards.reduce((maxId, card) => Math.max(maxId, card.id || 0), 0);
    nextState.nextId = Math.max(nextState.nextId, maxCardId + 1);
    nextState.selectedBot = Math.min(nextState.selectedBot, Math.max(0, nextState.bots.length - 1));

    state = nextState;
    pendingPackCards = [];
    return true;
  } catch (error) {
    console.error('Failed to load FutCard save.', error);
    return false;
  }
}

function resetGame() {
  const confirmed = window.confirm('Start a new game? Your saved FutCard progress will be erased.');
  if (!confirmed) return;

  if (hasStorageAccess()) {
    window.localStorage.removeItem(SAVE_KEY);
  }

  window.location.reload();
}

function generateMarket() {
  const count = 120;
  state.market = [];
  for (let i = 0; i < count; i++) {
    const p = generatePlayer(state.nextId++, null);
    p.listed = true;
    p.listPrice = p.currentPrice;
    state.market.push(p);
  }
}

function generateBots() {
  const botNames = [
    { name: 'TraderBot Alpha', emoji: '🤖', style: 'fair' },
    { name: 'GreedyBot', emoji: '💰', style: 'greedy' },
    { name: 'DealBot', emoji: '🤝', style: 'generous' },
    { name: 'EliteBot', emoji: '👑', style: 'elite' }
  ];
  state.bots = botNames.map((b, i) => {
    const cards = [];
    const rarityPool = b.style === 'elite'
      ? ['legendary','legendary','epic','epic','rare']
      : ['epic','rare','rare','common','common'];
    for (let j = 0; j < 20; j++) {
      const rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];
      cards.push(generatePlayer(state.nextId++, rarity));
    }
    return { ...b, id: i, cards };
  });
}

function giveStarterCards() {
  for (let i = 0; i < 10; i++) {
    const rarity = i < 2 ? 'rare' : 'common';
    state.collection.push(generatePlayer(state.nextId++, rarity));
  }
}

// ============================================================
// PRICE FLUCTUATION
// ============================================================
function fluctuatePrices() {
  const fluctuate = (card) => {
    const change = (Math.random() - 0.48) * 0.08;
    card.currentPrice = Math.max(100, Math.round(card.currentPrice * (1 + change)));
    card.priceHistory.push(card.currentPrice);
    if (card.priceHistory.length > 20) card.priceHistory.shift();
    if (card.listed) card.listPrice = card.currentPrice;
  };
  state.market.forEach(fluctuate);
  state.bots.forEach((b) => b.cards.forEach(fluctuate));
  state.collection.forEach(fluctuate);
  renderPriceTicker();
  if (document.getElementById('page-market').classList.contains('active')) renderMarket();
  if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
  saveState();
}

// ============================================================
// RENDER HELPERS
// ============================================================
function formatCoins(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function updateCoinsDisplay() {
  document.getElementById('coins-display').textContent = formatCoins(state.coins);
}

function rarityColor(r) {
  return { legendary: '#FF6B35', epic: '#9B59B6', rare: '#3498DB', common: '#95A5A6' }[r];
}

function buildCardHTML(card, options = {}) {
  const { showBuy, showSell, onClick } = options;
  const priceChange = card.priceHistory.length > 1
    ? card.currentPrice - card.priceHistory[card.priceHistory.length - 2]
    : 0;
  const changeIcon = priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '—';
  const changeColor = priceChange > 0 ? '#2ecc71' : priceChange < 0 ? '#e74c3c' : '#888';

  return `
    <div class="card ${card.rarity}" onclick="${onClick || `showCardDetail(${card.id})`}" style="position:relative;">
      <span class="card-rarity-badge">${card.rarity}</span>
      <div class="card-overall">${card.overall}</div>
      <div class="card-position">${card.position}</div>
      <div class="card-avatar" style="background:rgba(255,255,255,0.05);">${card.emoji}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-club">${card.nation} ${card.club}</div>
      <div class="card-stats">
        <div class="stat-item"><span class="stat-label">PAC</span><span class="stat-val">${card.pace}</span></div>
        <div class="stat-item"><span class="stat-label">SHO</span><span class="stat-val">${card.shooting}</span></div>
        <div class="stat-item"><span class="stat-label">PAS</span><span class="stat-val">${card.passing}</span></div>
        <div class="stat-item"><span class="stat-label">DRI</span><span class="stat-val">${card.dribbling}</span></div>
        <div class="stat-item"><span class="stat-label">DEF</span><span class="stat-val">${card.defense}</span></div>
      </div>
      <div class="card-price">
        🪙 ${formatCoins(card.currentPrice)}
        <span style="color:${changeColor};font-size:0.6rem;"> ${changeIcon}</span>
      </div>
      ${showBuy ? `<button class="btn btn-gold btn-sm market-buy-btn" onclick="event.stopPropagation();buyCard(${card.id})">Buy 🪙${formatCoins(card.listPrice)}</button>` : ''}
      ${showSell ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;" onclick="event.stopPropagation();openSellModal(${card.id})">Sell</button>` : ''}
    </div>`;
}

function buildMiniCard(card, removeCallback) {
  return `
    <div class="mini-card ${card.rarity}" style="position:relative;">
      <button class="mini-card-remove" onclick="${removeCallback}">✕</button>
      <div class="mini-card-overall" style="color:${rarityColor(card.rarity)}">${card.overall}</div>
      <div class="mini-card-name">${card.name.split(' ')[0]}</div>
      <div style="font-size:0.5rem;color:var(--muted)">${card.position}</div>
    </div>`;
}

// ============================================================
// PAGES
// ============================================================
function showPage(name) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const tabs = document.querySelectorAll('.nav-tab');
  const pageMap = { dashboard: 0, collection: 1, packs: 2, market: 3, trade: 4 };
  tabs[pageMap[name]].classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'collection') renderCollection();
  if (name === 'market') renderMarket();
  if (name === 'trade') renderTrade();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const totalValue = state.collection.reduce((s, c) => s + c.currentPrice, 0);
  const byRarity = { legendary: 0, epic: 0, rare: 0, common: 0 };
  state.collection.forEach((c) => byRarity[c.rarity]++);

  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat-box">
      <div class="stat-box-val">${state.collection.length}</div>
      <div class="stat-box-label">Total Cards</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--gold);">${formatCoins(totalValue)}</div>
      <div class="stat-box-label">Collection Value</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--legendary);">${byRarity.legendary}</div>
      <div class="stat-box-label">🟠 Legendary</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--epic);">${byRarity.epic}</div>
      <div class="stat-box-label">🟣 Epic</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--rare);">${byRarity.rare}</div>
      <div class="stat-box-label">🔵 Rare</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val">${byRarity.common}</div>
      <div class="stat-box-label">⚪ Common</div>
    </div>
  `;

  const best = [...state.collection].sort((a, b) => b.overall - a.overall).slice(0, 5);
  const bestGrid = document.getElementById('best-cards-grid');
  if (best.length === 0) {
    bestGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">Open some packs to get started!</div></div>';
  } else {
    bestGrid.innerHTML = best.map((c) => buildCardHTML(c, { showSell: true })).join('');
  }

  const hot = [...state.market].sort((a, b) => b.rarity.localeCompare(a.rarity)).slice(0, 5);
  document.getElementById('hot-listings-grid').innerHTML = hot.map((c) =>
    `<div class="market-card-wrap">${buildCardHTML(c, { showBuy: true })}</div>`
  ).join('');
}

// ============================================================
// PRICE TICKER
// ============================================================
function renderPriceTicker() {
  const featured = state.market
    .filter((c) => c.rarity === 'legendary' || c.rarity === 'epic')
    .slice(0, 10);
  document.getElementById('price-ticker').innerHTML = featured.map((c) => {
    const prev = c.priceHistory.length > 1 ? c.priceHistory[c.priceHistory.length - 2] : c.currentPrice;
    const change = ((c.currentPrice - prev) / prev * 100).toFixed(1);
    const cls = change > 0 ? 'up' : change < 0 ? 'down' : '';
    return `
      <div class="ticker-item">
        <span class="ticker-name">${c.name.split(' ')[1] || c.name}</span>
        <span class="ticker-price">🪙${formatCoins(c.currentPrice)}</span>
        <span class="ticker-change ${cls}">${change > 0 ? '+' : ''}${change}%</span>
      </div>`;
  }).join('');
}

// ============================================================
// COLLECTION
// ============================================================
function renderCollection() {
  let cards = [...state.collection];

  document.querySelectorAll('.rarity-filter-btn').forEach((button) => {
    button.className = 'rarity-filter-btn';
    if (button.dataset.rarity === state.collectionFilter) {
      button.classList.add('active-' + state.collectionFilter);
    }
  });

  if (state.collectionFilter !== 'all') {
    cards = cards.filter((c) => c.rarity === state.collectionFilter);
  }

  if (state.collectionSort === 'overall') cards.sort((a, b) => b.overall - a.overall);
  else if (state.collectionSort === 'rarity') {
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
    cards.sort((a, b) => order[a.rarity] - order[b.rarity]);
  } else if (state.collectionSort === 'price') {
    cards.sort((a, b) => b.currentPrice - a.currentPrice);
  }

  document.getElementById('collection-count-label').textContent =
    `${cards.length} cards shown · Total: ${state.collection.length}`;

  const grid = document.getElementById('collection-grid');
  if (cards.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🃏</div><div class="empty-state-text">No cards here yet!</div></div>';
  } else {
    grid.innerHTML = cards.map((c) => buildCardHTML(c, { showSell: true })).join('');
  }
}

function sortCollection(by) {
  state.collectionSort = by;
  renderCollection();
  saveState();
}

function filterCollection(rarity, btn) {
  state.collectionFilter = rarity;
  document.querySelectorAll('.rarity-filter-btn').forEach((b) => {
    b.className = 'rarity-filter-btn';
  });
  btn.classList.add('active-' + rarity);
  renderCollection();
  saveState();
}

// ============================================================
// PACKS
// ============================================================
const PACK_CONFIG = {
  bronze: {
    cost: 5000, count: 5, name: 'Bronze Pack',
    weights: { common: 75, rare: 20, epic: 5, legendary: 0 }
  },
  silver: {
    cost: 15000, count: 7, name: 'Silver Pack',
    weights: { common: 35, rare: 50, epic: 15, legendary: 0 }
  },
  gold: {
    cost: 35000, count: 8, name: 'Gold Pack',
    weights: { common: 10, rare: 50, epic: 30, legendary: 10 }
  },
  elite: {
    cost: 100000, count: 10, name: 'Elite Pack',
    weights: { common: 0, rare: 15, epic: 50, legendary: 35 }
  },
  ultimate: {
    cost: 250000, count: 12, name: 'Ultimate Pack',
    weights: { common: 0, rare: 10, epic: 45, legendary: 45 }
  }
};

function weightedRarity(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

function openPack(type) {
  const config = PACK_CONFIG[type];
  if (state.coins < config.cost) {
    showToast(`❌ Not enough coins! Need 🪙${formatCoins(config.cost)}`, 'error');
    return;
  }
  state.coins -= config.cost;
  updateCoinsDisplay();

  pendingPackCards = [];
  for (let i = 0; i < config.count; i++) {
    const rarity = weightedRarity(config.weights);
    pendingPackCards.push(generatePlayer(state.nextId++, rarity));
  }

  const overlay = document.getElementById('pack-overlay');
  const area = document.getElementById('pack-reveal-area');
  document.getElementById('pack-opening-title').textContent = `✨ ${config.name} Opened!`;
  area.innerHTML = pendingPackCards.map((c) => `
    <div class="pack-reveal-card" id="reveal-${c.id}">
      ${buildCardHTML(c, {})}
    </div>`).join('');

  overlay.classList.add('show');
  saveState();

  pendingPackCards.forEach((c, i) => {
    setTimeout(() => {
      document.getElementById('reveal-' + c.id)?.classList.add('revealed');
    }, i * 200 + 100);
  });
}

function closePack() {
  pendingPackCards.forEach((c) => state.collection.push(c));
  pendingPackCards = [];
  saveState();
  document.getElementById('pack-overlay').classList.remove('show');
  showToast('✅ Cards added to your collection!', 'success');
  updateCoinsDisplay();
}

// ============================================================
// MARKET
// ============================================================
function renderMarket() {
  const search = document.getElementById('market-search').value.toLowerCase();
  const rarityFilter = document.getElementById('market-rarity-filter').value;
  const sort = document.getElementById('market-sort').value;
  const posFilter = document.getElementById('market-position-filter').value;

  let cards = state.market.filter((c) => c.listed);

  if (search) cards = cards.filter((c) => c.name.toLowerCase().includes(search) || c.club.toLowerCase().includes(search));
  if (rarityFilter !== 'all') cards = cards.filter((c) => c.rarity === rarityFilter);
  if (posFilter !== 'all') cards = cards.filter((c) => c.position === posFilter);

  if (sort === 'price-asc') cards.sort((a, b) => a.listPrice - b.listPrice);
  else if (sort === 'price-desc') cards.sort((a, b) => b.listPrice - a.listPrice);
  else if (sort === 'overall-desc') cards.sort((a, b) => b.overall - a.overall);

  const grid = document.getElementById('market-grid');
  if (cards.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No cards match your filters</div></div>';
  } else {
    grid.innerHTML = cards.map((c) => `
      <div class="market-card-wrap">
        ${buildCardHTML(c, { showBuy: true })}
      </div>`).join('');
  }
}

function buyCard(id) {
  const card = state.market.find((c) => c.id === id);
  if (!card) return;
  if (state.coins < card.listPrice) {
    showToast(`❌ Not enough coins! Need 🪙${formatCoins(card.listPrice)}`, 'error');
    return;
  }
  state.coins -= card.listPrice;
  state.market = state.market.filter((c) => c.id !== id);
  card.listed = false;
  state.collection.push(card);
  updateCoinsDisplay();
  showToast(`✅ Bought ${card.name} for 🪙${formatCoins(card.listPrice)}!`, 'success');
  renderMarket();
  const newCard = generatePlayer(state.nextId++, null);
  newCard.listed = true;
  newCard.listPrice = newCard.currentPrice;
  state.market.push(newCard);
  saveState();
}

// ============================================================
// SELL
// ============================================================
function openSellModal(id) {
  const card = state.collection.find((c) => c.id === id);
  if (!card) return;
  state.sellCardId = id;
  document.getElementById('sell-modal-card-info').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;background:var(--bg);border-radius:10px;">
      <div style="font-size:2rem;">${card.emoji}</div>
      <div>
        <div style="font-weight:800;">${card.name}</div>
        <div style="font-size:0.8rem;color:var(--muted);">${card.position} · ${card.club}</div>
        <div style="font-size:0.8rem;color:${rarityColor(card.rarity)};text-transform:uppercase;font-weight:700;">${card.rarity}</div>
      </div>
      <div style="margin-left:auto;font-size:1.5rem;font-weight:900;color:${rarityColor(card.rarity)}">${card.overall}</div>
    </div>`;
  document.getElementById('sell-suggested-price').textContent =
    `💡 Suggested price: 🪙${formatCoins(card.currentPrice)} (market value)`;
  document.getElementById('sell-price-input').value = card.currentPrice;
  document.getElementById('sell-modal').classList.add('show');
}

function closeSellModal() {
  document.getElementById('sell-modal').classList.remove('show');
  state.sellCardId = null;
}

function confirmSell() {
  const price = parseInt(document.getElementById('sell-price-input').value);
  if (!price || price < 1) {
    showToast('❌ Enter a valid price', 'error');
    return;
  }
  const card = state.collection.find((c) => c.id === state.sellCardId);
  if (!card) return;

  state.collection = state.collection.filter((c) => c.id !== state.sellCardId);
  card.listed = true;
  card.listPrice = price;
  state.market.push(card);
  saveState();

  if (Math.random() < 0.5) {
    setTimeout(() => {
      state.market = state.market.filter((c) => c.id !== card.id);
      state.coins += price;
      saveState();
      updateCoinsDisplay();
      showToast(`💰 ${card.name} sold for 🪙${formatCoins(price)}!`, 'success');
      if (document.getElementById('page-market').classList.contains('active')) renderMarket();
    }, 2000 + Math.random() * 3000);
    showToast('📋 Listed! A buyer is interested...', 'warning');
  } else {
    showToast(`📋 ${card.name} listed on market for 🪙${formatCoins(price)}`, 'success');
  }

  closeSellModal();
  if (document.getElementById('page-collection').classList.contains('active')) renderCollection();
  if (document.getElementById('page-market').classList.contains('active')) renderMarket();
}

// ============================================================
// TRADE
// ============================================================
function renderTrade() {
  document.getElementById('bot-select').innerHTML = state.bots.map((b, i) => `
    <div class="bot-chip ${state.selectedBot === i ? 'selected' : ''}" onclick="selectBot(${i})">
      ${b.emoji} ${b.name}
    </div>`).join('');

  renderBotCollection();
  updateTradeSlots();
}

function selectBot(i) {
  state.selectedBot = i;
  state.botTradeCards = [];
  renderTrade();
  saveState();
}

function renderBotCollection() {
  const bot = state.bots[state.selectedBot];
  document.getElementById('bot-collection-title').textContent = `${bot.emoji} ${bot.name}'s Collection`;
  document.getElementById('bot-trade-title').textContent = `${bot.emoji} ${bot.name}'s Offer`;
  document.getElementById('bot-collection-grid').innerHTML = bot.cards.map((c) =>
    buildCardHTML(c, { onClick: `addBotCardToTrade(${c.id})` })
  ).join('');
}

function addBotCardToTrade(id) {
  const bot = state.bots[state.selectedBot];
  const card = bot.cards.find((c) => c.id === id);
  if (!card) return;
  if (state.botTradeCards.find((c) => c.id === id)) {
    showToast('Already in trade!', 'warning');
    return;
  }
  if (state.botTradeCards.length >= 5) {
    showToast('Max 5 cards per trade', 'warning');
    return;
  }
  state.botTradeCards.push(card);
  updateTradeSlots();
  showToast(`Added ${card.name} to trade request`, 'success');
}

function openTradeSelector(side) {
  const modal = document.getElementById('trade-selector-modal');
  const grid = document.getElementById('trade-selector-grid');
  document.getElementById('trade-selector-title').textContent =
    side === 'yours' ? '📤 Select Your Cards to Offer' : '📥 Select Bot Cards to Request';

  if (side === 'yours') {
    const available = state.collection.filter((c) => !state.yourTradeCards.find((t) => t.id === c.id));
    grid.innerHTML = available.map((c) =>
      `<div onclick="addToTrade('yours',${c.id})">${buildCardHTML(c, {})}</div>`
    ).join('');
  } else {
    const bot = state.bots[state.selectedBot];
    const available = bot.cards.filter((c) => !state.botTradeCards.find((t) => t.id === c.id));
    grid.innerHTML = available.map((c) =>
      `<div onclick="addToTrade('bot',${c.id})">${buildCardHTML(c, {})}</div>`
    ).join('');
  }
  modal.classList.add('show');
}

function addToTrade(side, id) {
  if (side === 'yours') {
    if (state.yourTradeCards.length >= 5) {
      showToast('Max 5 cards', 'warning');
      return;
    }
    const card = state.collection.find((c) => c.id === id);
    if (card) state.yourTradeCards.push(card);
  } else {
    if (state.botTradeCards.length >= 5) {
      showToast('Max 5 cards', 'warning');
      return;
    }
    const card = state.bots[state.selectedBot].cards.find((c) => c.id === id);
    if (card) state.botTradeCards.push(card);
  }
  closeTradeSelector();
  updateTradeSlots();
}

function closeTradeSelector() {
  document.getElementById('trade-selector-modal').classList.remove('show');
}

function removeFromTrade(side, id) {
  if (side === 'yours') state.yourTradeCards = state.yourTradeCards.filter((c) => c.id !== id);
  else state.botTradeCards = state.botTradeCards.filter((c) => c.id !== id);
  updateTradeSlots();
}

function updateTradeSlots() {
  const yourSlot = document.getElementById('your-trade-slot');
  const botSlot = document.getElementById('bot-trade-slot');

  if (state.yourTradeCards.length === 0) {
    yourSlot.innerHTML = '<span>+ Add your cards</span>';
  } else {
    yourSlot.innerHTML = state.yourTradeCards.map((c) =>
      buildMiniCard(c, `removeFromTrade('yours',${c.id})`)
    ).join('') + '<span style="font-size:0.7rem;color:var(--muted)">+ Add more</span>';
  }

  if (state.botTradeCards.length === 0) {
    botSlot.innerHTML = '<span>+ Select bot\'s cards</span>';
  } else {
    botSlot.innerHTML = state.botTradeCards.map((c) =>
      buildMiniCard(c, `removeFromTrade('bot',${c.id})`)
    ).join('') + '<span style="font-size:0.7rem;color:var(--muted)">+ Add more</span>';
  }

  updateTradeValues();
}

function updateTradeValues() {
  const yourVal = state.yourTradeCards.reduce((s, c) => s + c.currentPrice, 0)
    + (parseInt(document.getElementById('your-coin-offer').value) || 0);
  const botVal = state.botTradeCards.reduce((s, c) => s + c.currentPrice, 0);

  document.getElementById('your-trade-value').textContent = `🪙 ${formatCoins(yourVal)}`;
  document.getElementById('bot-trade-value').textContent = `🪙 ${formatCoins(botVal)}`;

  const fairnessBar = document.getElementById('trade-fairness-bar');
  const fairnessText = document.getElementById('fairness-text');

  if (state.yourTradeCards.length > 0 || state.botTradeCards.length > 0) {
    fairnessBar.style.display = 'block';
    const ratio = botVal > 0 ? yourVal / botVal : yourVal > 0 ? 99 : 1;
    if (ratio >= 0.85 && ratio <= 1.15) {
      fairnessText.textContent = '✅ Fair Trade — Bot likely to accept!';
      fairnessText.style.color = '#2ecc71';
    } else if (ratio < 0.85) {
      fairnessText.textContent = `⚠️ Your offer is low (${Math.round(ratio * 100)}% of bot's value) — Bot may reject`;
      fairnessText.style.color = '#e74c3c';
    } else {
      fairnessText.textContent = `🎉 Great deal for you! (${Math.round(ratio * 100)}%) — Bot will likely accept`;
      fairnessText.style.color = '#2ecc71';
    }
  } else {
    fairnessBar.style.display = 'none';
  }
}

function proposeTrade() {
  if (state.yourTradeCards.length === 0 && state.botTradeCards.length === 0) {
    showToast('❌ Add cards to trade first!', 'error');
    return;
  }

  const bot = state.bots[state.selectedBot];
  const yourVal = state.yourTradeCards.reduce((s, c) => s + c.currentPrice, 0)
    + (parseInt(document.getElementById('your-coin-offer').value) || 0);
  const botVal = state.botTradeCards.reduce((s, c) => s + c.currentPrice, 0);
  const coinOffer = parseInt(document.getElementById('your-coin-offer').value) || 0;

  if (coinOffer > state.coins) {
    showToast('❌ Not enough coins!', 'error');
    return;
  }

  const ratio = botVal > 0 ? yourVal / botVal : 1;
  const acceptThreshold = { fair: 0.85, greedy: 1.05, generous: 0.7, elite: 0.9 }[bot.style];
  const accepted = ratio >= acceptThreshold;

  setTimeout(() => {
    if (accepted) {
      state.yourTradeCards.forEach((c) => {
        state.collection = state.collection.filter((x) => x.id !== c.id);
        bot.cards.push(c);
      });
      state.botTradeCards.forEach((c) => {
        bot.cards = bot.cards.filter((x) => x.id !== c.id);
        state.collection.push(c);
      });
      state.coins -= coinOffer;
      saveState();
      updateCoinsDisplay();

      showToast(`✅ ${bot.emoji} ${bot.name} accepted the trade!`, 'success');
      clearTrade();
      renderTrade();
    } else {
      showToast(`❌ ${bot.emoji} ${bot.name} rejected! Try offering ${Math.round((1 / ratio) * 100 - 100)}% more value.`, 'error');
    }
  }, 1200);

  showToast(`⏳ ${bot.emoji} ${bot.name} is considering your offer...`, 'warning');
}

function clearTrade() {
  state.yourTradeCards = [];
  state.botTradeCards = [];
  document.getElementById('your-coin-offer').value = '';
  updateTradeSlots();
}

// ============================================================
// CARD DETAIL MODAL
// ============================================================
function showCardDetail(id) {
  const card =
    state.collection.find((c) => c.id === id) ||
    state.market.find((c) => c.id === id) ||
    state.bots.flatMap((b) => b.cards).find((c) => c.id === id);
  if (!card) return;

  const inCollection = state.collection.find((c) => c.id === id);
  const inMarket = state.market.find((c) => c.id === id);

  document.getElementById('card-modal-content').innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;">
      <div>${buildCardHTML(card, {})}</div>
      <div style="flex:1;min-width:200px;">
        <div style="font-size:1.3rem;font-weight:900;margin-bottom:4px;">${card.name}</div>
        <div style="color:${rarityColor(card.rarity)};font-weight:700;text-transform:uppercase;margin-bottom:8px;">${card.rarity}</div>
        <div style="color:var(--muted);font-size:0.85rem;margin-bottom:16px;">${card.nation} ${card.club} · ${card.position}</div>

        <div style="display:grid;gap:8px;margin-bottom:20px;">
          ${[['⚡ Pace', card.pace],['🎯 Shooting', card.shooting],['🎪 Passing', card.passing],['🌀 Dribbling', card.dribbling],['🛡️ Defense', card.defense]].map(([label, val]) => `
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:0.8rem;width:100px;">${label}</span>
              <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:8px;">
                <div style="width:${val}%;background:${rarityColor(card.rarity)};height:100%;border-radius:4px;"></div>
              </div>
              <span style="font-weight:700;font-size:0.9rem;width:30px;text-align:right;">${val}</span>
            </div>`).join('')}
        </div>

        <div style="font-size:1rem;font-weight:700;color:var(--gold);margin-bottom:16px;">
          Market Value: 🪙${formatCoins(card.currentPrice)}
        </div>

        ${inCollection ? `<button class="btn btn-gold" onclick="closeCardModal();openSellModal(${card.id})">💰 Sell This Card</button>` : ''}
        ${inMarket ? `<button class="btn btn-primary" onclick="closeCardModal();buyCard(${card.id})">🛒 Buy for 🪙${formatCoins(card.listPrice)}</button>` : ''}
      </div>
    </div>`;

  document.getElementById('card-modal').classList.add('show');
}

function closeCardModal() {
  document.getElementById('card-modal').classList.remove('show');
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// INIT
// ============================================================
function init() {
  const loaded = loadState();
  if (!loaded) {
    generateMarket();
    generateBots();
    giveStarterCards();
    saveState();
  }

  updateCoinsDisplay();
  renderDashboard();
  renderPriceTicker();
  renderCollection();

  setInterval(fluctuatePrices, 8000);
  window.addEventListener('beforeunload', saveState);

  document.getElementById('card-modal').addEventListener('click', function(e) {
    if (e.target === this) closeCardModal();
  });
  document.getElementById('sell-modal').addEventListener('click', function(e) {
    if (e.target === this) closeSellModal();
  });
  document.getElementById('trade-selector-modal').addEventListener('click', function(e) {
    if (e.target === this) closeTradeSelector();
  });

  if (loaded) {
    showToast('💾 Saved progress loaded.', 'success');
    if (recoveredPackCards > 0) {
      showToast(`📦 Recovered ${recoveredPackCards} unopened pack card${recoveredPackCards === 1 ? '' : 's'}.`, 'warning');
    }
  } else {
    showToast('🎉 Welcome to FutCard! You start with 🪙1,000,000 coins!', 'success');
  }
}

init();
