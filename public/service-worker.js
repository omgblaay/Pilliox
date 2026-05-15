// Pilliox Service Worker — v4
// Caching (PWA) + background notification scheduling + Web Push receiver

const CACHE_NAME = 'pilliox-v4';

// ── IndexedDB ────────────────────────────────────────────────────────────────
// Two stores:
//   'pending'  — scheduled notification payloads  { id, pillId, title, body, scheduledTime }
//   'config'   — app config + user token          { k, v }

const DB_NAME = 'pilliox-sw-db';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending'))
        db.createObjectStore('pending', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('config'))
        db.createObjectStore('config', { keyPath: 'k' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

// ── Config helpers ───────────────────────────────────────────────────────────

async function cfgGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readonly');
    const req = tx.objectStore('config').get(key);
    req.onsuccess = () => resolve(req.result?.v ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function cfgSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    tx.objectStore('config').put({ k: key, v: value });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function cfgDel(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    tx.objectStore('config').delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

// ── Notification schedule helpers ────────────────────────────────────────────

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readonly');
    const req = tx.objectStore('pending').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbPutAll(items) {
  if (!items.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    items.forEach(i => store.put(i));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteByPillId(pillId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    const req = store.getAll();
    req.onsuccess = () =>
      req.result.filter(n => n.pillId === pillId).forEach(n => store.delete(n.id));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').clear();
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

const timers = new Map();
const GRACE_MS = 60 * 60 * 1000;
const MAX_TIMEOUT = 2_147_483_647;

async function arm(item) {
  const delay = new Date(item.scheduledTime).getTime() - Date.now();

  if (delay <= 0) {
    if (-delay <= GRACE_MS) await showNotification(item);
    await dbDeleteById(item.id);
    notifyClients({ type: 'NOTIFICATION_FIRED', id: item.id, pillId: item.pillId });
    return;
  }

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
  } catch { /* IDB unavailable */ }
}

// ── Server notification processing ───────────────────────────────────────────
// Called by periodic sync so the server can send Web Push for due items
// even when no tab is open.

async function callProcessEndpoint() {
  try {
    const [projectId, anonKey, userToken] = await Promise.all([
      cfgGet('projectId'),
      cfgGet('anonKey'),
      cfgGet('userToken'),
    ]);

    if (!projectId || !anonKey || !userToken) return;

    await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/notification/process`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'X-User-Token': userToken,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch { /* network unavailable */ }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function notifyClients(message) {
  self.clients
    .matchAll({ includeUncontrolled: true })
    .then(cs => cs.forEach(c => c.postMessage(message)));
}

// ── Install / Activate ───────────────────────────────────────────────────────

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
      .then(names => Promise.all(names.map(n => n !== CACHE_NAME && caches.delete(n))))
      .then(() => self.clients.claim())
      .then(() => restoreFromDB())
  );
});

// ── Web Push receiver ────────────────────────────────────────────────────────
// Fires when the server sends a push — works even when the browser is closed
// (on supported platforms: Chrome/Android, desktop Chrome/Firefox/Edge).

self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || '💊 Pilliox', {
        body: data.body || '',
        icon: '/favicon_b.png',
        badge: '/favicon_b.png',
        tag: data.tag || 'pilliox',
        requireInteraction: false,
        data: { url: '/' },
      })
    );
  } catch { /* malformed push payload */ }
});

// ── Messages from main thread ─────────────────────────────────────────────────

self.addEventListener('message', async event => {
  const { type } = event.data || {};
  const reply = ok => event.ports[0]?.postMessage({ ok });

  // App config (projectId, anonKey) — sent once on app init
  if (type === 'SET_CONFIG') {
    await cfgSet('projectId', event.data.projectId);
    await cfgSet('anonKey', event.data.anonKey);
    reply(true);
    return;
  }

  // User auth token — sent after login / token refresh
  if (type === 'SET_USER_TOKEN') {
    if (event.data.token) {
      await cfgSet('userToken', event.data.token);
    } else {
      await cfgDel('userToken');
    }
    reply(true);
    return;
  }

  // Local notification scheduling (fallback timers for same-tab use)
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

// ── Periodic Background Sync (Chrome/Android installed PWA) ──────────────────

self.addEventListener('periodicsync', event => {
  if (event.tag === 'pilliox-notification-check') {
    event.waitUntil(
      restoreFromDB().then(() => callProcessEndpoint())
    );
  }
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// ── Fetch — network-first ────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
