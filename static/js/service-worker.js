// Nome della cache
const CACHE_NAME = 'menu-cache-v2';
const API_CACHE_NAME = 'api-cache-v1';

// File da mettere in cache
const urlsToCache = [
  '/',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/images/logo.webp',
  '/static/images/elogo.png'
];

// API endpoints da mettere in cache con strategia stale-while-revalidate
const apiUrlsToCache = [
  '/api/menu'
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestione delle richieste
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Gestione speciale per le richieste API (stale-while-revalidate)
  if (apiUrlsToCache.some(endpoint => requestUrl.pathname.includes(endpoint))) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Crea una promessa per l'aggiornamento della cache
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                // Aggiorna la cache con la nuova risposta
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Se la rete fallisce, ritorna null (useremo la cache)
              return null;
            });
          
          // Ritorna immediatamente la risposta dalla cache se disponibile
          // altrimenti attendi la risposta dalla rete
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // Gestione standard per le altre richieste
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - ritorna la risposta dalla cache
          if (response) {
            return response;
          }
          
          // Clona la richiesta
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then(
            response => {
              // Controlla se la risposta è valida
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clona la risposta
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  // Metti la risposta nella cache
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            }
          );
        })
    );
  }
});