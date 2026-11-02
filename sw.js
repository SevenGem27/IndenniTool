const CACHE_NAME = 'preavviso-cache-v6'; // Incrementa sempre questo numero a ogni modifica (es. v6, v7, v8...)

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

// FASE 1: Installazione e forzatura dell'aggiornamento
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Dice al Service Worker di non stare in sala d'attesa
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
            return caches.delete(cache); // Cancella i vecchi file dal telefono dell'utente
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende il controllo immediato della pagina corrente
  );
});

// FASE 3: Servizio dei file dalla cache (con ripiego su index.html se si apre l'app offline)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: event.request.mode === 'navigate' })
      .then(response => response || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        throw new Error('Risorsa non disponibile offline');
      })
  );
});
