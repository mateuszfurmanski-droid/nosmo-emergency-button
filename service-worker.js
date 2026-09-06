const CACHE_NAME = 'nosmo-emergency-core-v1-0008d-20260906';
const STATIC_ASSETS = [
  './','./index.html','./VERSION','./styles.css','./engine.css','./site-medical.css','./site-card.css','./multilingual.css','./field.css','./app.webmanifest',
  './src/app.js','./src/emergency-state.js','./src/site-medical-ui.js','./src/site-emergency-card.js','./src/multilingual-runtime.js','./src/site-language.js','./src/field-runtime.js','./src/runtime-recovery.js','./src/i18n.js',
  './src/lang/en.js','./src/lang/pl.js','./src/lang/ro.js','./src/lang/ur.js','./src/lang/pa.js','./src/lang/bn.js','./src/lang/gu.js','./src/lang/ar.js','./src/lang/pt.js','./src/lang/es.js','./src/lang/fr.js','./src/lang/lt.js','./src/lang/bg.js','./src/lang/uk.js','./src/lang/zh.js','./src/lang/tr.js','./src/lang/it.js',
  './icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(STATIC_ASSETS)));self.skipWaiting();});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith('nosmo-emergency')&&key!==CACHE_NAME).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',(event)=>{const r=event.request;if(r.method!=='GET')return;const url=new URL(r.url);if(url.origin!==self.location.origin)return;if(r.mode==='navigate'){event.respondWith(fetch(r).then((res)=>{const copy=res.clone();caches.open(CACHE_NAME).then((cache)=>cache.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html')));return;}event.respondWith(caches.match(r).then((cached)=>cached||fetch(r).then((res)=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(r,copy));}return res;})));});
