// Classic-script Teams interface. Saved teams stay untouched until Save succeeds.
const TeamsUI = (() => {
  let api, root, draft = null, baseline = '', isNew = false, editing = false;
  let selected = null, query = '', position = 'all', ghost = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy = value => JSON.parse(JSON.stringify(value));
  const dirty = () => Boolean(draft && editing && (isNew || JSON.stringify(draft) !== baseline));
  const cards = () => api.getCollection();
  const findCard = id => cards().find(card => card.id === Number(id));
  const button = (action, label, extra = '', style = 'btn-outline') => `<button type="button" class="btn ${style} btn-sm" data-action="${action}" ${extra}>${label}</button>`;

  function fullCard(card) {
    // The existing card renderer interpolates string fields, so escape a copy at this boundary.
    const safe = Object.fromEntries(Object.entries(card).map(([key, value]) => [key, typeof value === 'string' ? escape(value) : value]));
    return api.buildCardHTML(safe, {onClick: 'event.stopPropagation()'});
  }
  function notify(message, type = 'info') { api.toast(message, type); }
  function clearDraft() { draft = null; baseline = ''; isNew = false; editing = false; selected = null; query = ''; position = 'all'; }
  function canLeave() {
    if (dirty() && !window.confirm('Discard your unsaved team changes?')) return false;
    clearDraft();
    return true;
  }
  function reconcileDraft() {
    if (!draft || !api) return;
    // Reconcile missing cards even while the user is typing an invalid/empty name.
    const name = draft.name;
    const normalized = TeamsModel.normalize({...draft, name: 'Draft'}, cards());
    if (normalized) { normalized.name = name; draft = normalized; }
    if (selected !== null && !findCard(selected)) selected = null;
  }
  function init(options) {
    api = options;
    const element = document.getElementById('teams-root');
    if (!element || element === root) return;
    root = element;
    root.addEventListener('click', handleClick);
    // Capture card clicks before buildCardHTML's stopPropagation handler.
    root.addEventListener('click', handleCardClick, true);
    root.addEventListener('input', handleInput);
    root.addEventListener('change', handleInput);
    root.addEventListener('keydown', handleKey);
    root.addEventListener('dragstart', handleDragStart);
    root.addEventListener('dragend', removeGhost);
    root.addEventListener('dragover', handleDragOver);
    root.addEventListener('dragleave', event => event.target.closest('[data-slot]')?.classList.remove('teams-drop-target'));
    root.addEventListener('drop', handleDrop);
    window.addEventListener('beforeunload', event => {
      if (!dirty()) return;
      event.preventDefault(); event.returnValue = '';
    });
  }
  function openTeam(team, edit, fresh = false) {
    draft = copy(team); baseline = JSON.stringify(draft); editing = edit; isNew = fresh;
    selected = null; query = ''; position = 'all'; render();
  }
  function saveDraft() {
    if (!draft || !editing) return;
    if (!TeamsModel.validateName(draft.name)) {
      notify('Choose a team name between 1 and 40 characters.', 'warning');
      root.querySelector('[data-field="name"]')?.focus(); return;
    }
    reconcileDraft(); draft.name = draft.name.trim();
    const teams = api.getTeams(), previous = teams.slice();
    const index = teams.findIndex(team => team.id === draft.id);
    if (index === -1) teams.push(copy(draft)); else teams[index] = copy(draft);
    let saved = false;
    try { saved = api.save() === true; } catch (_) { /* Keep the draft available for retry. */ }
    if (!saved) {
      teams.splice(0, teams.length, ...previous);
      notify('Could not save this team. Your draft is still here; try again.', 'warning');
      return;
    }
    clearDraft(); render(); notify('Team saved.', 'success');
  }
  function deleteTeam(id) {
    const teams = api.getTeams(), index = teams.findIndex(team => team.id === Number(id));
    if (index < 0 || !window.confirm(`Delete "${teams[index].name}"? This cannot be undone.`)) return;
    const previous = teams.slice(); teams.splice(index, 1);
    let saved = false;
    try { saved = api.save() === true; } catch (_) { /* Restore on failure. */ }
    if (!saved) { teams.splice(0, teams.length, ...previous); notify('Could not save the deletion. Team restored.', 'warning'); return; }
    render(); notify('Team deleted.', 'success');
  }
  function place(slotId, cardId = selected) {
    if (!draft || !editing || cardId === null) return;
    if (TeamsModel.assign(draft, slotId, Number(cardId), cards())) {
      selected = null; render();
      root.querySelector(`[data-slot="${slotId}"]`)?.focus();
    }
  }
  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target || !root.contains(target)) return;
    const action = target.dataset.action;
    if (action === 'create') { if (canLeave()) openTeam(TeamsModel.create(api.nextId(), 'New team'), true, true); }
    else if (action === 'view' || action === 'edit') {
      const team = api.getTeams().find(item => item.id === Number(target.dataset.team));
      if (team && canLeave()) openTeam(team, action === 'edit');
    } else if (action === 'edit-current') { editing = true; render(); }
    else if (action === 'save') saveDraft();
    else if (action === 'cancel') { if (canLeave()) render(); }
    else if (action === 'delete') deleteTeam(target.dataset.team);
    else if (action === 'select' && editing) { selected = Number(target.dataset.card); renderSelection(); }
    else if (action === 'deselect') { selected = null; renderSelection(); }
    else if (action === 'slot') {
      if (selected !== null) place(target.dataset.slot);
      else if (editing && draft.slots[target.dataset.slot] !== null) { selected = draft.slots[target.dataset.slot]; renderSelection(); }
    } else if (action === 'remove' && editing) {
      draft.slots[target.dataset.slot] = null; selected = null; render();
      root.querySelector(`[data-slot="${target.dataset.slot}"]`)?.focus();
    }
  }
  function handleCardClick(event) {
    if (event.target.closest('[data-action="remove"]')) return;
    const slot = event.target.closest('[data-slot][data-action="slot"]');
    if (!slot || !event.target.closest('.card')) return;
    event.stopPropagation(); handleClick({target: slot});
  }
  function handleInput(event) {
    const field = event.target.dataset.field;
    if (field === 'name' && draft && editing) draft.name = event.target.value.slice(0, 40);
    if (field === 'search') { query = event.target.value; renderRows(); }
    if (field === 'position') { position = event.target.value; renderRows(); }
  }
  function handleKey(event) {
    if (event.key === 'Escape') { selected = null; renderSelection(); return; }
    const slot = event.target.closest('[data-slot][data-action="slot"]');
    if (!slot || event.target.closest('button')) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleClick({target: slot}); }
    if ((event.key === 'Delete' || event.key === 'Backspace') && editing) {
      event.preventDefault(); draft.slots[slot.dataset.slot] = null; selected = null; render();
      root.querySelector(`[data-slot="${slot.dataset.slot}"]`)?.focus();
    }
  }
  function removeGhost() {
    ghost?.remove(); ghost = null;
    root?.querySelectorAll('.teams-drop-target').forEach(element => element.classList.remove('teams-drop-target'));
  }
  function handleDragStart(event) {
    const source = event.target.closest('[data-card]');
    if (!editing || !source || !event.dataTransfer) return;
    const card = findCard(source.dataset.card); if (!card) return;
    event.dataTransfer.setData('application/x-futcard-card', String(card.id));
    event.dataTransfer.effectAllowed = 'move';
    selected = card.id;
    removeGhost(); ghost = document.createElement('div');
    ghost.className = 'teams-drag-ghost'; ghost.innerHTML = fullCard(card);
    root.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 80, 100);
    // Do not replace the source row during dragstart: browsers cancel that drag.
  }
  function handleDragOver(event) {
    const slot = event.target.closest('[data-slot][data-action="slot"]');
    if (!slot || !editing || !event.dataTransfer?.types.includes('application/x-futcard-card')) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'move'; slot.classList.add('teams-drop-target');
  }
  function handleDrop(event) {
    const slot = event.target.closest('[data-slot][data-action="slot"]');
    if (!slot || !editing || !event.dataTransfer) return;
    const id = event.dataTransfer.getData('application/x-futcard-card');
    if (!id) return;
    event.preventDefault(); removeGhost(); place(slot.dataset.slot, Number(id));
  }
  function rowHTML() {
    const term = query.trim().toLowerCase();
    const filtered = cards().filter(card => (position === 'all' || card.position === position) &&
      `${card.name} ${card.position} ${card.overall} ${card.rarity} ${card.club} ${card.nation}`.toLowerCase().includes(term)).sort((a, b) => b.overall - a.overall);
    return filtered.map(card => {
      const used = Object.values(draft.slots).includes(card.id);
      return `<button type="button" class="teams-card-row${selected === card.id ? ' teams-selected' : ''}" data-action="select" data-card="${escape(card.id)}" draggable="true" aria-pressed="${selected === card.id}"><strong>${escape(card.overall)}</strong><span><b>${escape(card.name)}</b><small>${escape(card.position)} · ${escape(card.rarity)} · ${escape(card.club)}</small>${used ? '<small class="teams-used">On pitch - select to move</small>' : ''}</span></button>`;
    }).join('') || '<p class="teams-empty">No matching cards in your collection.</p>';
  }
  function renderRows() { const rows = root.querySelector('.teams-card-list'); if (rows) rows.innerHTML = rowHTML(); }
  function renderSelection() {
    const message = root.querySelector('.teams-selection');
    const card = selected === null ? null : findCard(selected);
    if (message) message.innerHTML = card ? `Selected: <strong>${escape(card.name)}</strong>. Choose a slot to place or replace. ${button('deselect', 'Clear selection')}` : 'Select a player, then a slot. Drag and drop also works. Any position is allowed.';
    renderRows();
    root.querySelectorAll('[data-slot][data-action="slot"]').forEach(slot => {
      slot.classList.toggle('teams-selected', selected !== null && draft.slots[slot.dataset.slot] === selected);
    });
  }
  function pitchHTML() {
    const order = ['lw','st','rw','cm-left','cdm','cm-right','lb','cb-left','cb-right','rb','gk'];
    return `<div class="teams-pitch-scroll" tabindex="0" aria-label="Half pitch, scroll horizontally to see all slots"><div class="teams-pitch">${order.map(id => {
      const slot = TeamsModel.slots.find(item => item.id === id); if (!slot) return '';
      const card = findCard(draft.slots[id]);
      const label = `${slot.position} ${id.replace(/-/g,' ')}: ${card ? card.name : 'Empty'}`;
      return `<div class="teams-slot teams-slot-${id}" data-action="slot" data-slot="${id}" ${card ? `data-card="${escape(card.id)}"` : ''} draggable="${Boolean(editing && card)}" ${editing ? 'tabindex="0" role="button"' : ''} aria-label="${escape(label)}"><span class="teams-slot-label">${escape(slot.position)}</span>${card ? fullCard(card) : '<div class="teams-vacancy">+<span>Empty slot</span></div>'}${editing && card ? button('remove', 'Remove', `data-slot="${id}" aria-label="Remove ${escape(card.name)} from ${escape(slot.position)}"`) : ''}</div>`;
    }).join('')}</div></div>`;
  }
  function render() {
    if (!root || !api) return;
    if (!draft) {
      root.innerHTML = `<div class="teams-toolbar"><div><h2>My teams</h2><p>Build and save your own 4-3-3 lineups.</p></div>${button('create','Create team','','btn-primary')}</div><div class="teams-library">${api.getTeams().map(team => {
        const count = TeamsModel.slots.filter(slot => findCard(team.slots[slot.id])).length;
        return `<article class="teams-preview"><h3>${escape(team.name)}</h3><div class="teams-mini-pitch" aria-hidden="true">${TeamsModel.slots.map(slot => `<i class="${findCard(team.slots[slot.id]) ? 'filled' : ''}"></i>`).join('')}</div><p>4-3-3 · ${count}/11 players</p><div class="teams-actions">${button('view','View',`data-team="${escape(team.id)}"`)}${button('edit','Edit',`data-team="${escape(team.id)}"`)}${button('delete','Delete',`data-team="${escape(team.id)}"`,'btn-danger')}</div></article>`;
      }).join('') || '<p class="teams-empty">No teams yet. Create your first XI.</p>'}</div>`;
      return;
    }
    reconcileDraft();
    const positions = ['GK','LB','CB','RB','CDM','CM','CAM','LW','ST','RW','CF'];
    root.innerHTML = `<div class="teams-toolbar"><div>${editing ? `<label class="teams-name-label" for="teams-name">Team name</label><input id="teams-name" class="search-input" data-field="name" maxlength="40" value="${escape(draft.name)}" autocomplete="off">` : `<h2>${escape(draft.name)}</h2>`}<p>4-3-3 · ${Object.values(draft.slots).filter(id => id !== null).length}/11 players</p></div><div class="teams-actions">${editing ? button('save','Save team','','btn-primary') : button('edit-current','Edit team','','btn-primary')}${button('cancel',editing ? 'Cancel' : 'Back to teams')}</div></div><div class="teams-editor">${editing ? `<aside class="teams-sidebar"><h3>Your collection</h3><label class="teams-field-label" for="teams-search">Search players</label><input id="teams-search" class="search-input" data-field="search" type="search" placeholder="Name, club, rarity..." value="${escape(query)}"><label class="teams-field-label" for="teams-position">Position</label><select id="teams-position" class="filter-select" data-field="position"><option value="all">All positions</option>${positions.map(p => `<option${p === position ? ' selected' : ''}>${p}</option>`).join('')}</select><div class="teams-card-list">${rowHTML()}</div></aside>` : ''}<section class="teams-field"><p class="teams-selection" aria-live="polite">${editing ? 'Select a player, then a slot. Drag and drop also works. Any position is allowed.' : 'Your saved lineup. Edit this team to make changes.'}</p>${pitchHTML()}</section></div>`;
    if (editing) renderSelection();
  }
  return {init, render, canLeave, reconcileDraft};
})();
