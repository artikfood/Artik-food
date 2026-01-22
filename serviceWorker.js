const CACHE_NAME = 'artik-food-v1.3';
const OFFLINE_URL = '/offline.html';

// Файлы для кэширования
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data.json',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-192x192.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Кэширование файлов');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация
self.addEventListener('activate', event => {
  console.log('[Service Worker] Активация');
  // Удаляем старые кэши
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', event => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша если есть
        if (response) {
          return response;
        }

        // Иначе загружаем из сети
        return fetch(event.request)
          .then(response => {
            // Проверяем валидный ответ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ
            const responseToCache = response.clone();

            // Кэшируем новый ресурс
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            // Если оффлайн и это HTML запрос
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            console.error('[Service Worker] Ошибка загрузки:', error);
          });
      })
  );
});

// Получение push-уведомлений
self.addEventListener('push', event => {
  console.log('[Service Worker] Получено push-уведомление', event);

  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Artik Food',
      body: event.data.text()
    };
  }

  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Artik Food', options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Клик по уведомлению', event.notification.data);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Открываем/фокусируем окно
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Проверяем открытые окна
        for (let client of windowClients) {
          if (client.url.includes(event.notification.data.url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Открываем новое окно
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
  );
});

// Background sync для офлайн заказов
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// Функция синхронизации заказов
async function syncOrders() {
  try {
    const db = await openOrdersDB();
    const orders = await getAllPendingOrders(db);
    
    for (const order of orders) {
      try {
        // Пытаемся отправить заказ
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          // Удаляем из локальной БД при успехе
          await deleteOrder(db, order.id);
        }
      } catch (error) {
        console.error('[Service Worker] Ошибка синхронизации заказа:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Ошибка syncOrders:', error);
  }
}

// IndexedDB для офлайн заказов
function openOrdersDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ArtikFoodOrders', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

function getAllPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const index = store.index('status');
    const request = index.getAll('pending');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteOrder(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
