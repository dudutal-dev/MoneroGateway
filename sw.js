/* Gateway — service worker
   מטרה: שהאפליקציה תיפתח ותעבוד במלואה גם בלי חיבור לרשת.
   אסטרטגיה: network-first לדף עצמו (כדי לקבל עדכונים), עם נפילה למטמון.
   הגופנים מוטמעים בתוך index.html — אין עוד תלות בשרתי גופנים חיצוניים. */

const VERSION = 'gateway-2026.08.11-b35-fidelity';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // הדף עצמו (וקבצים מקומיים כמו ה-PDF): מהרשת קודם, ועם נפילה למטמון כשאין חיבור
  if (req.mode === 'navigate' || url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});
