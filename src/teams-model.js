const TeamsModel = (() => {
  const formation = '4-3-3';
  const slots = Object.freeze([
    { id: 'gk', position: 'GK' },
    { id: 'lb', position: 'LB' },
    { id: 'cb-left', position: 'CB' },
    { id: 'cb-right', position: 'CB' },
    { id: 'rb', position: 'RB' },
    { id: 'cm-left', position: 'CM' },
    { id: 'cdm', position: 'CDM' },
    { id: 'cm-right', position: 'CM' },
    { id: 'lw', position: 'LW' },
    { id: 'st', position: 'ST' },
    { id: 'rw', position: 'RW' },
  ].map(Object.freeze));

  const validId = id => Number.isInteger(id) && id > 0;

  function collectionIds(collection) {
    return new Set((Array.isArray(collection) ? collection : [])
      .filter(card => card && validId(card.id)).map(card => card.id));
  }

  function validateName(name) {
    if (typeof name !== 'string') return null;
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 40 ? trimmed : null;
  }

  function create(id, name) {
    const validatedName = validateName(name);
    if (!validId(id) || validatedName === null) return null;
    return { id, name: validatedName, formation, slots: Object.fromEntries(slots.map(slot => [slot.id, null])) };
  }

  function assign(team, slotId, cardId, collection) {
    if (!team || !team.slots || typeof team.slots !== 'object' || Array.isArray(team.slots)) return false;
    if (!slots.some(slot => slot.id === slotId)) return false;
    if (cardId !== null && (!validId(cardId) || !Array.isArray(collection) || !collection.some(card => card && card.id === cardId))) return false;
    for (const slot of slots) {
      if (team.slots[slot.id] === cardId) team.slots[slot.id] = null;
    }
    team.slots[slotId] = cardId;
    return true;
  }

  function normalize(team, collection) {
    if (!team || typeof team !== 'object' || Array.isArray(team)) return null;
    const normalized = create(team.id, team.name);
    if (!normalized) return null;
    const available = collectionIds(collection);
    const seen = new Set();
    for (const slot of slots) {
      const cardId = team.slots && team.slots[slot.id];
      if (validId(cardId) && available.has(cardId) && !seen.has(cardId)) {
        normalized.slots[slot.id] = cardId;
        seen.add(cardId);
      }
    }
    return normalized;
  }

  function reconcile(teams, collection) {
    if (!Array.isArray(teams)) return;
    const available = collectionIds(collection);
    for (const team of teams) {
      if (!team || !team.slots || typeof team.slots !== 'object' || Array.isArray(team.slots)) continue;
      const seen = new Set();
      for (const slot of slots) {
        const cardId = team.slots[slot.id];
        if (!validId(cardId) || !available.has(cardId) || seen.has(cardId)) {
          team.slots[slot.id] = null;
        } else {
          seen.add(cardId);
        }
      }
    }
  }

  return { formation, slots, create, validateName, assign, normalize, reconcile };
})();
