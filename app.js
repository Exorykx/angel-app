// ----------------------
// Splash-Screen
window.addEventListener('load', async () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = 0;

    setTimeout(() => {
      splash.style.display = 'none';
      document.getElementById('app').style.display = 'block';
    }, 500);
  }, 1000);
});

// ----------------------
// Globaler Status
let aktuellerModus = 'fische';
let alleFische = [];
let alleKnoten = [];

// ----------------------
// Daten laden
async function loadFische() {
  const res = await fetch('./data/fische.json');
  alleFische = await res.json();
}

async function loadKnoten() {
  const res = await fetch('./data/knoten.json');
  alleKnoten = await res.json();
}

// ----------------------
// Navigation
async function showFische() {
  aktuellerModus = 'fische';

  document.getElementById('filter').style.display = 'block';
  document.getElementById('search-input').placeholder = '🔍 Fisch suchen...';

  if (alleFische.length === 0) {
    await loadFische();
  }

  applySearch();
}

async function showKnoten() {
  aktuellerModus = 'knoten';

  document.getElementById('filter').style.display = 'none';
  document.getElementById('search-input').placeholder = '🔍 Knoten suchen...';

  if (alleKnoten.length === 0) {
    await loadKnoten();
  }

  applySearch();
}

// ----------------------
// Suche (für beide)
function applySearch() {
  const suchtext = document
    .getElementById('search-input')
    .value
    .toLowerCase();

  if (aktuellerModus === 'fische') {
    applyFilter(suchtext);
  } else {
    const gefiltert = alleKnoten.filter(knoten =>
      knoten.name.toLowerCase().includes(suchtext)
    );
    displayKnoten(gefiltert);
  }
}

// ----------------------
// Filter (NUR Fische)
function applyFilter(suchtext = '') {
  const filterSchonzeit =
    document.getElementById('filter-schonzeit').checked;
  const filterMindest =
    document.getElementById('filter-mindestmass').checked;

  const gefiltert = alleFische.filter(fisch => {
    let passt = true;

    if (suchtext) {
      passt = fisch.name.toLowerCase().includes(suchtext);
    }

    if (filterSchonzeit) {
      passt = passt && fisch.schonzeit !== '–';
    }

    if (filterMindest) {
      passt = passt && fisch.mindestmass !== '–';
    }

    return passt;
  });

  displayFische(gefiltert);
}

// ----------------------
// Anzeige Fische
function displayFische(fische) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (fische.length === 0) {
    content.innerHTML = '<p>❌ Keine Fische gefunden.</p>';
    return;
  }

  fische.forEach((fisch, index) => {
    // Variable definieren
    const hatSchonzeit = fisch.schonzeit !== '–';

    content.innerHTML += `
      <div class="card fish-card" onclick="toggleInfo(${index})">
        <h3>${fisch.name}</h3>
        
        <!-- Badge -->
        <span class="badge ${hatSchonzeit ? 'badge-warning' : 'badge-ok'}">
          ${hatSchonzeit ? 'Schonzeit beachten' : 'Keine Schonzeit'}
        </span>

        <p>Schonzeit: ${fisch.schonzeit}</p>
        <p>Mindestmaß: ${fisch.mindestmass}</p>

        <div class="extra-info" id="info-${index}">
          <p>${fisch.info || 'Keine zusätzlichen Informationen vorhanden.'}</p>
        </div>
      </div>
    `;
  });
}


// ----------------------
// Anzeige Knoten
function displayKnoten(knoten) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (knoten.length === 0) {
    content.innerHTML = '<p>❌ Keine Knoten gefunden.</p>';
    return;
  }

  knoten.forEach((k, index) => {
    content.innerHTML += `
      <div class="card knoten-card" onclick="toggleKnotenInfo(${index})">
        <h3>${k.name}</h3>
        <p>Knotenfestigkeit: ${k.Knotenfestigkeit}</p>
        <p>Verwendung: ${k.verwendung}</p>
        <p>Anleitung: ${k.anleitung}</p>

        <div class="extra-info" id="knoten-info-${index}">
          <p>${k.info || 'Keine zusätzlichen Informationen vorhanden.'}</p>
        </div>
      </div>
    `;
  });
}

// ----------------------
// Toggle Infos
function toggleInfo(index) {
  const el = document.getElementById(`info-${index}`);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

function toggleKnotenInfo(index) {
  const el = document.getElementById(`knoten-info-${index}`);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ----------------------
// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}
