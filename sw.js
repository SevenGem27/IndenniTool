const CACHE_NAME = 'preavviso-cache-v5'; // Incrementa sempre questo numero a ogni modifica (es. v4, v5, v6...)
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon.png'
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

// FASE 3: Servizio dei file dalla nuova cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
