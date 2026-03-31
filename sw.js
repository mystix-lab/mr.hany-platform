// Service Worker - منصة الاختبارات | أ. هاني محمد الداودي
// v2.0 - محسّن: استراتيجية Network-First لضمان تحميل أحدث الملفات دائماً

const CACHE_NAME    = 'mr-hany-exams-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './admin.html',
    './manifest.json',
    './manifest-admin.json'
];

// التثبيت: تخزين الأصول الأساسية فقط
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// التفعيل: حذف الكاشات القديمة
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(n => n !== CACHE_NAME)
                    .map(n => caches.delete(n))
            )
        ).then(() => self.clients.claim())
    );
});

// الاستجابة: Network-First — يضمن الحصول على أحدث البيانات من الشبكة
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // تجاهل طلبات Firebase و Google Fonts — تتعامل معها مكتباتها
    if (
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('cdnjs')
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    // استراتيجية Network-First للملفات المحلية
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // تحديث الكاش بالنسخة الجديدة
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() =>
                // الرجوع للكاش عند انقطاع الاتصال
                caches.match(event.request)
            )
    );
});
