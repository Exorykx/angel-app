async function showFische() {
  const res = await fetch('data/fische.json');
  const fische = await res.json();

  const content = document.getElementById('content');
  content.innerHTML = '';

  fische.forEach(fisch => {
    content.innerHTML += `
      <div class="card">
        <h3>${fisch.name}</h3>
        <p>Schonzeit: ${fisch.schonzeit}</p>
        <p>Mindestmaß: ${fisch.mindestmass}</p>
      </div>
    `;
  });
}

// Service Worker aktivieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
