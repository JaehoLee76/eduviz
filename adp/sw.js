/* ADP Master — 서비스워커
   목적: 홈 화면에 추가한 뒤 오프라인에서도 허브·실험실이 열리게 한다.
   전략: cache-first (설치 시 핵심 파일을 미리 저장, 이후 요청은 캐시 우선·실패 시 네트워크). */
const CACHE_NAME = 'adp-master-v11';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './tutor.js',
  './qna.js',
  './labs.js',
  './drill.js',
  './topics.html',
  './topics/index.js',
  './topics/test-statistic.js',
  './topics/sampling-distributions.js',
  './topics/qq-plot.js',
  './topics/assumption-failure.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './labs/0001-fuel-economy-workflow.html',
  './labs/0002-anova-lab.html',
  './labs/0003-real-regression-problem.html',
  './labs/0004-binomial-lab.html',
  './labs/0005-chisq-lab.html',
  './labs/0006-proportion-lab.html',
  './labs/0007-ttest-lab.html'
];

self.addEventListener('install', function(evt){
  evt.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(evt){
  evt.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(name){
        if(name !== CACHE_NAME){ return caches.delete(name); }
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(evt){
  if(evt.request.method !== 'GET') return;

  // 문서(HTML)는 network-first: 새 내용이 있으면 항상 최신을 먼저 보여주고,
  // 캐시는 오프라인일 때만 쓴다. (cache-first면 색·내용을 바꿔도 옛 화면이 남는다.)
  var isDoc = evt.request.mode === 'navigate' ||
              (evt.request.headers.get('accept') || '').indexOf('text/html') >= 0;
  if(isDoc){
    evt.respondWith(
      fetch(evt.request).then(function(res){
        if(res && res.status === 200){
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(evt.request, clone); });
        }
        return res;
      }).catch(function(){
        return caches.match(evt.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 그 외 자산(아이콘 등)은 cache-first 유지.
  evt.respondWith(
    caches.match(evt.request).then(function(cached){
      if(cached) return cached;
      return fetch(evt.request).then(function(res){
        // 성공한 GET 응답은 다음 오프라인 방문을 위해 캐시에 채워 둔다.
        if(res && res.status === 200 && res.type === 'basic'){
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(evt.request, clone); });
        }
        return res;
      }).catch(function(){
        // 오프라인이고 캐시에도 없는 경우: 문서 요청이면 허브로 대체.
        if(evt.request.mode === 'navigate'){ return caches.match('./index.html'); }
      });
    })
  );
});
