const CACHE_NAME = 'alhan-erp-v1';

// Install event: Open cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event: Network-first falling back to cache
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/S requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful requests dynamically
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback return for index.html if request is a document navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network connection lost, and no cached copy is available.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
