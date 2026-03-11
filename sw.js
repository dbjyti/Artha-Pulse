const CACHE = 'artha-pulse-v1';
const PRECACHE = ['/index.html','/manifest.json','/icon-192.png','/icon-512.png','/apple-touch-icon.png'];
const CDN = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE).then(c => c.addAll(PRECACHE)),
      caches.open(CACHE+'-cdn').then(c =>
        Promise.allSettled(CDN.map(url =>
          fetch(url,{mode:'cors'}).then(r=>{ if(r.ok) c.put(url,r); }).catch(()=>{})
        ))
      )
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k!==CACHE && k!==CACHE+'-cdn').map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if(e.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
