const CACHE_NAME = 'nosmo-emergency-core-v1-0004-20260905';
const STATIC_ASSETS = [
  './','./index.html','./styles.css','./engine.css','./app.webmanifest',
  './src/app.js','./src/emergency-state.js','./icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(STATIC_ASSETS)));self.skipWaiting();});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith('nosmo-emergency')&&key!==CACHE_NAME).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',(event)=>{const r=event.request;if(r.method!=='GET')return;const url=new URL(r.url);if(url.origin!==self.location.origin)return;if(r.mode==='navigate'){event.respondWith(fetch(r).then((res)=>{const copy=res.clone();caches.open(CACHE_NAME).then((cache)=>cache.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html')));return;}event.respondWith(caches.match(r).then((cached)=>cached||fetch(r).then((res)=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(r,copy));}return res;})));});
