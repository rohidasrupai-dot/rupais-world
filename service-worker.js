'use strict';

const CACHE_VERSION = 'phase14c-v3';
const SHELL_CACHE = `rupai-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rupai-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';
const OFFLINE_ASSET_URL = './offline-asset.svg';

const APP_SHELL = [
  './', './index.html', './subjects.html', './student-reader.html',
  './student-dashboard.html', './student-learning-coach.html',
  './student-memory-dashboard.html', './student-progress-dashboard.html',
  './student-study-planner.html', './student-settings.html', './revision.html',
  './offline-library.html', './offline-library.css', './offline-library.js',
  './offline-library-service.js',
  './offline.html', './offline-asset.svg', './manifest.webmanifest', './pwa-client.js', './pwa-client.css',
  './home.css', './home.js', './subjects.css', './subjects.js',
  './student-reader.css', './student-reader-blocks.css', './student-reader-interactions.css',
  './student-dashboard.css', './student-dashboard.js', './student-reader-service.js',
  './student-reader.js', './studio/store.js', './studio/auth.js',
  './assets/pwa-icon-192.png', './assets/pwa-icon-512.png',
  './assets/curio-official-v3.png', './assets/rupais-world-official-logo-v2.png'
];

const REQUIRED_SHELL = ['./index.html', './student-reader.html', './offline.html', './pwa-client.js', './pwa-client.css'];

const STUDENT_PAGES = new Set([
  '', 'index.html', 'subjects.html', 'student-reader.html', 'student-dashboard.html',
  'student-learning-coach.html', 'student-memory-dashboard.html',
  'student-progress-dashboard.html', 'student-study-planner.html',
  'student-settings.html', 'offline-library.html', 'revision.html', 'history.html', 'ancient-history.html',
  'medieval-history.html', 'modern-history.html', 'search.html', 'search-result.html',
  'favorites.html'
]);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE), failed = [];
    for (const url of APP_SHELL) {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (_) { failed.push(url); }
    }
    const keys = await cache.keys(), cached = new Set(keys.map(request => new URL(request.url).pathname.split('/').pop()));
    if (REQUIRED_SHELL.some(url => !cached.has(url.split('/').pop()))) throw new Error(`Required app shell is incomplete: ${failed.join(', ')}`);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const runtime = await caches.open(RUNTIME_CACHE);
    for (const name of names.filter(value => value.startsWith('rupai-runtime-') && value !== RUNTIME_CACHE)) {
      const previous = await caches.open(name), requests = await previous.keys();
      for (const request of requests) {
        if (!await runtime.match(request)) {
          const response = await previous.match(request);
          if (response) await runtime.put(request, response);
        }
      }
    }
    await Promise.all(names.filter(name => name.startsWith('rupai-') && ![SHELL_CACHE, RUNTIME_CACHE].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const message = event.data || {};
  if (message.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  const reply = value => event.ports?.[0]?.postMessage(value);
  if (message.type === 'CACHE_URLS') {
    event.waitUntil((async () => {
      const cache = await caches.open(RUNTIME_CACHE), cached = [], failed = [];
      for (const raw of Array.isArray(message.urls) ? message.urls : []) {
        try {
          const url = new URL(raw, self.location.origin);
          if (url.origin !== self.location.origin || /(?:auth|credential|secret|token)/i.test(url.pathname)) throw new Error('Unsupported resource');
          const request = new Request(url.href, { credentials: 'same-origin' }), response = await fetch(request);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(request, response.clone()); cached.push(url.href);
        } catch (_) { failed.push(String(raw)); }
      }
      reply({ ok: cached.length > 0 && failed.length === 0, cached, failed, reason: failed.length ? 'Some lesson resources are not currently available.' : null });
    })());
    return;
  }
  if (message.type === 'REMOVE_URLS') {
    event.waitUntil((async () => {
      const cache = await caches.open(RUNTIME_CACHE), removed = [];
      for (const raw of Array.isArray(message.urls) ? message.urls : []) {
        const url = new URL(raw, self.location.origin);
        if (url.origin === self.location.origin && await cache.delete(url.href, { ignoreSearch: false })) removed.push(url.href);
      }
      reply({ ok: true, removed });
    })());
    return;
  }
  if (message.type === 'CACHE_SUMMARY') {
    event.waitUntil((async () => {
      const shell = await caches.open(SHELL_CACHE), runtime = await caches.open(RUNTIME_CACHE), shellKeys = await shell.keys(), runtimeKeys = await runtime.keys();
      reply({ ok: true, entries: shellKeys.length + runtimeKeys.length, shellEntries: shellKeys.length, offlineEntries: runtimeKeys.length, version: CACHE_VERSION });
    })());
    return;
  }
  if (message.type === 'CHECK_URLS') {
    event.waitUntil((async () => {
      const results = [];
      for (const raw of Array.isArray(message.urls) ? message.urls : []) {
        const url = new URL(raw, self.location.origin), match = url.origin === self.location.origin ? await caches.match(url.href, { ignoreSearch: false }) : null;
        results.push({ url: String(raw), cached: Boolean(match) });
      }
      reply({ ok: true, results });
    })());
    return;
  }
  if (message.type === 'CLEAR_OFFLINE_CONTENT') {
    event.waitUntil((async () => { await caches.delete(RUNTIME_CACHE); await caches.open(RUNTIME_CACHE); reply({ ok: true }); })());
  }
});

function isCacheableStatic(url) {
  return url.origin === self.location.origin && /\.(?:css|js|png|jpe?g|webp|svg|ico|json|webmanifest)$/i.test(url.pathname);
}

async function navigationResponse(request) {
  const url = new URL(request.url);
  const page = url.pathname.split('/').pop();
  if (!STUDENT_PAGES.has(page)) return fetch(request);
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  } catch (_) {
    return (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match(`./${page || 'index.html'}`, { ignoreSearch: true })) ||
      (await caches.match(OFFLINE_URL));
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (!isCacheableStatic(url)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    const fresh = fetch(request).then(async response => {
      if (response.ok && response.type === 'basic') (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
      return response;
    }).catch(() => null);
    if (cached) return cached;
    const response = await fresh;
    if (response) return response;
    if (request.destination === 'image') return (await caches.match(OFFLINE_ASSET_URL)) || Response.error();
    return Response.error();
  })());
});
