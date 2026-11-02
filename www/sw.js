const C="roccos-academy-v2",F=["./","index.html","app.js","lessons.js","problems.js","config.js","monetize.js","manifest.json","rocco.jpg","icon-64.png","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x))))));
self.addEventListener("fetch",e=>{if(e.request.method!="GET"||!e.request.url.startsWith(self.location.origin))return;e.respondWith(fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
