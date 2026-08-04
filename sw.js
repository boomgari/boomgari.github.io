const CACHE='mwb-v56';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{
  // 逐个缓存：单个资源失败（如字体缺失）不影响其余，避免 addAll 原子失败导致整批未缓存
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return; // 不缓存跨域
  // HTML / 导航：网络优先，失败回退缓存（沙箱休眠也能开），上线即更新
  if(req.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname==='/'||url.pathname===''){
    e.respondWith(fetch(req).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(req,c));return res;})
      .catch(()=>caches.match(req).then(r=>r||caches.match('./')||caches.match('./index.html'))));
    return;
  }
  // 静态资源：缓存优先，回源并更新
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(req,c));return res;}).catch(()=>caches.match('./'))));
});
