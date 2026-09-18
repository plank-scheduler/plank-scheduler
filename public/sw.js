// Install support only. Customer requests and personal details are never cached.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plank — Connection needed</title><body style="font:18px/1.6 Arial;padding:32px;max-width:520px;margin:auto"><h1>You’re offline.</h1><p>Please reconnect to send your service request. No request has been sent while offline.</p><p>You can also call <a href="tel:5733683333">573-368-3333</a>.</p><a href="/booking">Try again</a></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
