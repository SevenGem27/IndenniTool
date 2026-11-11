// Incrementa questo numero a ogni pubblicazione (v7, v8, v9...): così le app già
// installate scaricano il nuovo Service Worker e si ricaricano da sole.
const CACHE_NAME = 'preavviso-cache-v9';

// ATTENZIONE: ogni file elencato qui deve esistere con esattamente questo nome.
// Se anche uno solo manca, l'installazione del Service Worker fallisce e l'app non funziona offline.
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './vendor/jspdf.umd.min.js'
];

// File che non cambiano mai: serviti subito dalla cache
const FILE_STATICI = ['/vendor/', '.png'];

// Oltre questo tempo senza risposta dalla rete si usa la copia salvata
const TIMEOUT_RETE_MS = 4000;

// FASE 1: Installazione
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' scarica sempre dal server, ignorando la cache HTTP del browser
      // (GitHub Pages la mantiene per 10 minuti e potrebbe dare file vecchi)
      .then(cache => cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()) // Il nuovo Service Worker si attiva subito
  );
});

// FASE 2: Attivazione e pulizia AUTOMATICA delle vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Vecchia cache eliminata:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende il controllo immediato delle pagine aperte
  );
});

// Prima la rete (versione più recente), poi la cache se si è offline o la rete è lenta
function primaLaRete(request) {
  return caches.open(CACHE_NAME).then(cache => new Promise(resolve => {
    let risposto = false;
    const rispondi = response => {
      if (risposto || !response) return;
      risposto = true;
      resolve(response);
    };

    // Rete lenta: dopo il timeout si usa la copia salvata (se esiste)
    const timer = setTimeout(() => cercaInCache(cache, request).then(rispondi), TIMEOUT_RETE_MS);

    // 'no-cache' chiede sempre al server se il file è cambiato
    fetch(request, { cache: 'no-cache' })
      .then(response => {
        clearTimeout(timer);
        if (response.ok) cache.put(request, response.clone()); // aggiorna la copia offline
        rispondi(response);
      })
      .catch(() => {
        clearTimeout(timer);
        cercaInCache(cache, request).then(r => rispondi(r || Response.error()));
      });
  }));
}

function cercaInCache(cache, request) {
  const navigazione = request.mode === 'navigate';
  return cache.match(request, { ignoreSearch: navigazione })
    .then(r => r || (navigazione ? cache.match('./index.html') : undefined));
}

// FASE 3: Servizio dei file
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (FILE_STATICI.some(f => url.pathname.includes(f))) {
    event.respondWith(caches.match(request).then(r => r || fetch(request)));
  } else {
    event.respondWith(primaLaRete(request));
  }
});
