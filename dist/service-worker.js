// Pilliox Service Worker
// Handles caching (PWA) + background notification scheduling via IndexedDB

const CACHE_NAME = 'pilliox-v3';
const DB_NAME = 'pilliox-sw-notifications';
const DB_STORE = 'pending';
const GRACE_MS = 60 * 60 * 1000;       // 1-hour late-fire window
const MAX_TIMEOUT = 2_147_483_647;      // 32-bit signed int ceiling for setTimeout

// ── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE, { keyPath: 'id' });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbPutAll(items) {
  if (!items.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteByPillId(pillId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      req.result
        .filter(n => n.pillId === pillId)
        .forEach(n => store.delete(n.id));
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

// ── Notification display ─────────────────────────────────────────────────────

function showNotification(item) {
  return self.registration.showNotification(item.title, {
    body: item.body,
    icon: '/favicon_b.png',
    badge: '/favicon_b.png',
    tag: `pill-${item.pillId}-${item.id}`,
    requireInteraction: false,
    data: { pillId: item.pillId, url: '/' },
  });
}

// ── Timer management ─────────────────────────────────────────────────────────

// Maps notification id → setTimeout handle, kept in SW memory
const timers = new Map();

async function arm(item) {
  const delay = new Date(item.scheduledTime).getTime() - Date.now();

  if (delay <= 0) {
    // Already past — fire immediately if within grace window
    if (-delay <= GRACE_MS) {
      await showNotification(item);
    }
    await dbDeleteById(item.id);
    // Notify open clients so they can remove it from localStorage too
    notifyClients({ type: 'NOTIFICATION_FIRED', id: item.id, pillId: item.pillId });
    return;
  }

  // Too far out for setTimeout (> ~24 days) — will be armed on next SW restart or sync
  if (delay > MAX_TIMEOUT) return;

  if (timers.has(item.id)) clearTimeout(timers.get(item.id));

  const handle = setTimeout(async () => {
    timers.delete(item.id);
    await showNotification(item);
    await dbDeleteById(item.id);
    notifyClients({ type: 'NOTIFICATION_FIRED', id: item.id, pillId: item.pillId });
  }, delay);

  timers.set(item.id, handle);
}

async function restoreFromDB() {
  try {
    const items = await dbGetAll();
    await Promise.all(items.map(arm));
  } catch {
    // IDB unavailable — silent fail
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function notifyClients(message) {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage(message));
  });
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['/', '/index.html']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.map(n => n !== CACHE_NAME && caches.delete(n))
      ))
      .then(() => self.clients.claim())
      .then(() => restoreFromDB())       // arm any timers persisted from before SW restart
  );
});

// ── Messages from the main thread ────────────────────────────────────────────

self.addEventListener('message', async event => {
  const { type } = event.data || {};
  const reply = ok => event.ports[0]?.postMessage({ ok });

  if (type === 'SCHEDULE_NOTIFICATIONS') {
    await dbPutAll(event.data.notifications);
    await Promise.all(event.data.notifications.map(arm));
    reply(true);
    return;
  }

  if (type === 'CANCEL_PILL') {
    const all = await dbGetAll();
    all.filter(n => n.pillId === event.data.pillId).forEach(n => {
      clearTimeout(timers.get(n.id));
      timers.delete(n.id);
    });
    await dbDeleteByPillId(event.data.pillId);
    reply(true);
    return;
  }

  if (type === 'CANCEL_ALL') {
    timers.forEach(clearTimeout);
    timers.clear();
    await dbClear();
    reply(true);
    return;
  }

  if (type === 'RESTORE') {
    await restoreFromDB();
    reply(true);
    return;
  }
});

// ── Periodic Background Sync (Chrome/Android) ────────────────────────────────
// The browser wakes the SW on a schedule to re-arm any timers that were
// lost when the SW was terminated.

self.addEventListener('periodicsync', event => {
  if (event.tag === 'pilliox-notification-check') {
    event.waitUntil(restoreFromDB());
  }
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Fetch — network-first with cache fallback ────────────────────────────────

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
