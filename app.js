const state = {
  mode: 'fische',
  fische: [],
  knoten: [],
  expandedCard: null
};

const textFixes = new Map([
  ['Ã¤', 'ä'],
  ['Ã„', 'Ä'],
  ['Ã¶', 'ö'],
  ['Ã–', 'Ö'],
  ['Ã¼', 'ü'],
  ['Ãœ', 'Ü'],
  ['ÃŸ', 'ß'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['â€ž', '„'],
  ['â€œ', '“'],
  ['â€"', '”'],
  ['â€š', '‚'],
  ['â€˜', '‘'],
  ['â€™', '’'],
  ['â€¦', '…'],
  ['ðŸŽ£', '🎣'],
  ['ðŸŸ', '🐟'],
  ['ðŸª¢', '🪢'],
  ['ðŸ”', '🔍'],
  ['âŒ', '❌']
]);

const ui = {
  app: document.getElementById('app'),
  splash: document.getElementById('splash'),
  content: document.getElementById('content'),
  filter: document.getElementById('filter'),
  searchInput: document.getElementById('search-input'),
  resultsSummary: document.getElementById('results-summary'),
  statusMessage: document.getElementById('status-message'),
  filterSchonzeit: document.getElementById('filter-schonzeit'),
  filterMindestmass: document.getElementById('filter-mindestmass'),
  modeButtons: [...document.querySelectorAll('.mode-button')]
};

window.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();

  try {
    await Promise.all([loadFische(), loadKnoten()]);
    switchMode('fische');
  } catch (error) {
    showStatus('Die Daten konnten nicht geladen werden. Bitte versuche es erneut.');
    console.error(error);
  } finally {
    revealApp();
  }

  registerServiceWorker();
}

function bindEvents() {
  ui.modeButtons.forEach(button => {
    button.addEventListener('click', () => switchMode(button.dataset.mode));
  });

  ui.searchInput.addEventListener('input', renderCurrentView);
  ui.filterSchonzeit.addEventListener('change', renderCurrentView);
  ui.filterMindestmass.addEventListener('change', renderCurrentView);
  ui.content.addEventListener('click', handleCardToggle);
}

function revealApp() {
  window.setTimeout(() => {
    ui.splash.classList.add('is-hidden');
    ui.app.classList.remove('hidden');
  }, 500);
}

async function loadFische() {
  const response = await fetch('./data/fische.json');

  if (!response.ok) {
    throw new Error(`fische.json konnte nicht geladen werden (${response.status})`);
  }

  const data = await response.json();
  state.fische = data.map(item => sanitizeEntry(item));
}

async function loadKnoten() {
  const response = await fetch('./data/knoten.json');

  if (!response.ok) {
    throw new Error(`knoten.json konnte nicht geladen werden (${response.status})`);
  }

  const data = await response.json();
  state.knoten = data.map(item => sanitizeEntry(item));
}

function sanitizeEntry(entry) {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => {
      if (typeof value !== 'string') {
        return [key, value];
      }

      return [key, normalizeText(value)];
    })
  );
}

function normalizeText(value) {
  let nextValue = value;

  textFixes.forEach((replacement, broken) => {
    nextValue = nextValue.replaceAll(broken, replacement);
  });

  return nextValue;
}

function switchMode(mode) {
  state.mode = mode;
  state.expandedCard = null;

  const isFische = mode === 'fische';
  ui.filter.hidden = !isFische;
  ui.searchInput.placeholder = isFische ? 'Fisch suchen...' : 'Knoten suchen...';

  ui.modeButtons.forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });

  renderCurrentView();
}

function renderCurrentView() {
  clearStatus();

  const searchTerm = ui.searchInput.value.trim().toLowerCase();
  const items = state.mode === 'fische' ? getFilteredFische(searchTerm) : getFilteredKnoten(searchTerm);

  ui.resultsSummary.textContent = createResultsCopy(items.length);

  if (items.length === 0) {
    ui.content.innerHTML = `
      <article class="empty-state">
        <h2>Keine Treffer</h2>
        <p>Probiere einen anderen Suchbegriff oder passe die Filter an.</p>
      </article>
    `;
    return;
  }

  ui.content.innerHTML = items.map(item => createCardMarkup(item)).join('');
}

function getFilteredFische(searchTerm) {
  return state.fische.filter(fisch => {
    const matchesSearch = !searchTerm || fisch.name.toLowerCase().includes(searchTerm);
    const hasSchonzeit = hasValue(fisch.schonzeit);
    const hasMindestmass = hasValue(fisch.mindestmass);

    if (!matchesSearch) {
      return false;
    }

    if (ui.filterSchonzeit.checked && !hasSchonzeit) {
      return false;
    }

    if (ui.filterMindestmass.checked && !hasMindestmass) {
      return false;
    }

    return true;
  });
}

function getFilteredKnoten(searchTerm) {
  return state.knoten.filter(knoten => {
    const haystack = [
      knoten.name,
      knoten.verwendung,
      knoten.anleitung,
      knoten.info
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return !searchTerm || haystack.includes(searchTerm);
  });
}

function hasValue(value) {
  return Boolean(value) && value !== '–' && value !== '-';
}

function createResultsCopy(count) {
  const label = state.mode === 'fische' ? 'Fische' : 'Knoten';
  return `${count} ${label} gefunden`;
}

function createCardMarkup(item) {
  if (state.mode === 'fische') {
    return createFishCard(item);
  }

  return createKnotenCard(item);
}

function createFishCard(fisch) {
  const id = createCardId(fisch.name);
  const expanded = state.expandedCard === id;
  const hasSchonzeit = hasValue(fisch.schonzeit);
  const info = fisch.info || 'Keine zusätzlichen Informationen vorhanden.';

  return `
    <article class="card fish-card ${expanded ? 'is-expanded' : ''}">
      <button class="card-toggle" type="button" data-card-id="${escapeAttribute(id)}" aria-expanded="${expanded}">
        <div class="card-head">
          <div>
            <p class="card-kicker">Fischart</p>
            <h2>${escapeHtml(fisch.name)}</h2>
          </div>
          <span class="badge ${hasSchonzeit ? 'badge-warning' : 'badge-ok'}">
            ${hasSchonzeit ? 'Schonzeit beachten' : 'Keine Schonzeit'}
          </span>
        </div>
        <dl class="facts-grid">
          <div>
            <dt>Schonzeit</dt>
            <dd>${escapeHtml(fisch.schonzeit)}</dd>
          </div>
          <div>
            <dt>Mindestmaß</dt>
            <dd>${escapeHtml(fisch.mindestmass)}</dd>
          </div>
        </dl>
        <div class="extra-info" ${expanded ? '' : 'hidden'}>
          <p>${escapeHtml(info)}</p>
        </div>
      </button>
    </article>
  `;
}

function createKnotenCard(knoten) {
  const id = createCardId(knoten.name);
  const expanded = state.expandedCard === id;
  const info = knoten.info || 'Keine zusätzlichen Informationen vorhanden.';

  return `
    <article class="card knoten-card ${expanded ? 'is-expanded' : ''}">
      <button class="card-toggle" type="button" data-card-id="${escapeAttribute(id)}" aria-expanded="${expanded}">
        <div class="card-head">
          <div>
            <p class="card-kicker">Knoten</p>
            <h2>${escapeHtml(knoten.name)}</h2>
          </div>
          <span class="strength-pill">${escapeHtml(knoten.Knotenfestigkeit || 'ohne Angabe')}</span>
        </div>
        <dl class="facts-grid">
          <div>
            <dt>Verwendung</dt>
            <dd>${escapeHtml(knoten.verwendung || 'Keine Angabe')}</dd>
          </div>
          <div>
            <dt>Anleitung</dt>
            <dd>${escapeHtml(knoten.anleitung || 'Keine Angabe')}</dd>
          </div>
        </dl>
        <div class="extra-info" ${expanded ? '' : 'hidden'}>
          <p>${escapeHtml(info)}</p>
        </div>
      </button>
    </article>
  `;
}

function createCardId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function handleCardToggle(event) {
  const button = event.target.closest('[data-card-id]');

  if (!button) {
    return;
  }

  const { cardId } = button.dataset;
  state.expandedCard = state.expandedCard === cardId ? null : cardId;
  renderCurrentView();
}

function showStatus(message) {
  ui.statusMessage.textContent = message;
  ui.statusMessage.classList.remove('hidden');
}

function clearStatus() {
  ui.statusMessage.textContent = '';
  ui.statusMessage.classList.add('hidden');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register('./service-worker.js').catch(error => {
    console.error('Service Worker konnte nicht registriert werden:', error);
  });
}
