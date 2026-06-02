// POCT 전자 지침서 Service Worker
// ⚠️ 배포할 때마다 자동으로 index.html을 새로 받아서 캐시 갱신

const CACHE_NAME = 'poct-2026-06-02';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 새 캐시로 파일 저장
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting(); // 즉시 활성화
});

// 활성화: 이전 버전 캐시 모두 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] 구버전 캐시 삭제:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// 요청 처리: index.html은 항상 네트워크 우선
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML은 항상 네트워크에서 최신 버전 가져오기
  if (url.pathname.endsWith('.html') || url.pathname === '/' || e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // 오프라인 시 캐시 사용
    );
    return;
  }

  // 나머지(이미지, json): 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// 새 버전 감지 시 즉시 적용
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
