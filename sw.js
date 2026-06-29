const CACHE_NAME = 'vsouza-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-512.png'
];

// Instalacao - cache todos os arquivos essenciais
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache vsouza-v3 aberto');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativacao - limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estrategia cache first, fallback network
self.addEventListener('fetch', (e) => {
  // Ignora requisicoes externas (como analytics)
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((response) => {
      // Retorna do cache se disponivel
      if (response) {
        return response;
      }

      // Caso contrario, busca na rede
      return fetch(e.request).then((networkResponse) => {
        // Cacheia novas respostas dinamicamente
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline - retorna index.html para navegacao
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      // Para outros recursos, retorna erro
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
