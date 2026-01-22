/* ---------------- АДМИН-ПАНЕЛЬ ---------------- */

// Пароль для входа (можете изменить)
const ADMIN_PASSWORD = "artik123";

// Хранилище заказов (в реальном приложении нужно на бэкенде)
let orders = JSON.parse(localStorage.getItem('artikFoodOrders')) || [];
let couriers = JSON.parse(localStorage.getItem('artikFoodCouriers')) || [];

// Функции админки
function showAdminLogin() {
  const password = prompt("Введите пароль администратора:");
  if (password === ADMIN_PASSWORD) {
    showAdminPanel();
  } else if (password) {
    alert("Неверный пароль");
  }
}

function showAdminPanel() {
  document.getElementById('admin-panel').classList.remove('hidden');
  document.getElementById('admin-login-btn').style.display = 'none';
  updateAdminStats();
}

function hideAdminPanel() {
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-login-btn').style.display = 'block';
}

function updateAdminStats() {
  // Статистика за сегодня
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.date).toDateString() === today
  );
  
  document.getElementById('today-orders').textContent = todayOrders.length;
  document.getElementById('today-amount').textContent = 
    todayOrders.reduce((sum, order) => sum + order.total, 0);
  document.getElementById('active-couriers').textContent = 
    couriers.filter(c => c.status === 'active').length;
  
  // Последние заказы
  const recentOrdersContainer = document.getElementById('recent-orders');
  recentOrdersContainer.innerHTML = '';
  
  const lastOrders = orders.slice(-5).reverse();
  lastOrders.forEach(order => {
    const div = document.createElement('div');
    div.style.padding = '8px';
    div.style.borderBottom = '1px solid #eee';
    div.innerHTML = `
      <strong>${order.name}</strong> — ${order.total} AMD<br>
      <small>${order.address} • ${order.date}</small>
    `;
    recentOrdersContainer.appendChild(div);
  });
  
  if (lastOrders.length === 0) {
    recentOrdersContainer.innerHTML = '<p style="text-align:center; color:#777;">Нет заказов</p>';
  }
  
  // Список курьеров
  const couriersContainer = document.getElementById('couriers-list');
  couriersContainer.innerHTML = '';
  
  couriers.forEach(courier => {
    const div = document.createElement('div');
    div.style.padding = '8px';
    div.style.borderBottom = '1px solid #eee';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.innerHTML = `
      <div>
        <strong>${courier.name}</strong><br>
        <small>📱 ${courier.phone} • ${courier.status === 'active' ? '🟢 Активен' : '🔴 Неактивен'}</small>
      </div>
      <button onclick="toggleCourierStatus(${courier.id})" style="font-size:12px;">
        ${courier.status === 'active' ? 'Деактивировать' : 'Активировать'}
      </button>
    `;
    couriersContainer.appendChild(div);
  });
}

// Сохранение заказа (добавьте в функцию sendFormToWhatsApp)
function saveOrder(orderData) {
  const order = {
    id: Date.now(),
    ...orderData,
    date: new Date().toLocaleString(),
    status: 'new',
    courier: null
  };
  
  orders.push(order);
  localStorage.setItem('artikFoodOrders', JSON.stringify(orders));
  updateAdminStats();
}

// Обновите функцию sendFormToWhatsApp:
function sendFormToWhatsApp() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const district = document.getElementById('district').value;
  const comment = document.getElementById('comment').value;

  let text = `🛒 Новый заказ Artik Food%0A%0A`;
  text += `👤 Имя: ${name}%0A`;
  text += `📞 Телефон: ${phone}%0A`;
  text += `📍 Адрес: ${address} (${district})%0A`;
  if (comment) text += `💬 Комментарий: ${comment}%0A`;
  text += `%0A📦 Товары:%0A`;

  let goodsTotal = 0;
  Object.keys(carts).forEach(storeKey => {
    Object.entries(carts[storeKey]).forEach(([name, data]) => {
      if (data.qty > 0) {
        text += `- ${stores[storeKey].name}: ${name} × ${data.qty} = ${data.qty * data.price} AMD%0A`;
        goodsTotal += data.qty * data.price;
      }
    });
  });

  const delivery = district === "Артик" ? 500 : 
                   district === "Арич" ? 700 : 
                   district === "Нор-Кянк" ? 1000 : 
                   district === "Пемзашен" ? 1000 : 0;
  const total = goodsTotal + delivery;
  
  text += `%0A💰 Итого товары: ${goodsTotal} AMD%0A`;
  text += `🚚 Доставка: ${delivery} AMD%0A`;
  text += `💵 К оплате: ${total} AMD%0A%0A`;
  text += `_Заказ создан через сайт_`;

  // Сохраняем заказ
  saveOrder({
    name, phone, address, district, comment,
    items: JSON.parse(JSON.stringify(carts)),
    total: total,
    delivery: delivery
  });

  window.open(`https://wa.me/37443797727?text=${text}`, '_blank');
  
  // Очищаем корзину после заказа
  carts = {};
  renderGlobalCart();
  if (currentStore) updateStoreCart();
  document.getElementById('order-form').reset();
  
  alert('Заказ отправлен! Ожидайте звонка оператора.');
}

/* ---------------- УПРАВЛЕНИЕ КУРЬЕРАМИ ---------------- */

let nextCourierId = 1;

function addCourier() {
  const name = prompt("Имя курьера:");
  if (!name) return;
  
  const phone = prompt("Телефон курьера:");
  if (!phone) return;
  
  const courier = {
    id: nextCourierId++,
    name: name,
    phone: phone,
    status: 'active',
    orders: []
  };
  
  couriers.push(courier);
  localStorage.setItem('artikFoodCouriers', JSON.stringify(couriers));
  updateAdminStats();
  alert(`Курьер ${name} добавлен!`);
}

function toggleCourierStatus(courierId) {
  const courier = couriers.find(c => c.id === courierId);
  if (courier) {
    courier.status = courier.status === 'active' ? 'inactive' : 'active';
    localStorage.setItem('artikFoodCouriers', JSON.stringify(couriers));
    updateAdminStats();
  }
}

function manageCouriers() {
  alert("Управление курьерами\n\nДобавлено курьеров: " + couriers.length + 
        "\nАктивных: " + couriers.filter(c => c.status === 'active').length);
}

/* ---------------- ДРУГИЕ ФУНКЦИИ АДМИНКИ ---------------- */

function addNewProduct() {
  alert("Здесь будет добавление новых товаров.\nВ реальном приложении нужен бэкенд для управления товарами.");
}

function viewAllOrders() {
  alert("Всего заказов: " + orders.length + 
        "\nНа сумму: " + orders.reduce((sum, o) => sum + o.total, 0) + " AMD");
}

/* ---------------- ИНИЦИАЛИЗАЦИЯ АДМИНКИ ---------------- */

// При загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  // Загружаем данные
  const savedOrders = localStorage.getItem('artikFoodOrders');
  const savedCouriers = localStorage.getItem('artikFoodCouriers');
  
  if (savedOrders) orders = JSON.parse(savedOrders);
  if (savedCouriers) {
    couriers = JSON.parse(savedCouriers);
    // Находим максимальный ID для nextCourierId
    if (couriers.length > 0) {
      nextCourierId = Math.max(...couriers.map(c => c.id)) + 1;
    }
  }
});


/* ========== СИСТЕМА ОПОВЕЩЕНИЙ ========== */

// Хранилище уведомлений
let notifications = JSON.parse(localStorage.getItem('artikFoodNotifications')) || {
  couriers: [],
  stores: []
};

// Типы уведомлений
const NOTIFICATION_TYPES = {
  NEW_ORDER: '🆕 Новый заказ',
  ORDER_ACCEPTED: '✅ Заказ принят',
  ORDER_DELIVERED: '📦 Заказ доставлен',
  ORDER_CANCELLED: '❌ Заказ отменен',
  ASSIGNED_TO_COURIER: '🚴 Назначен курьеру',
  PAYMENT_RECEIVED: '💰 Оплата получена',
  STORE_NEW_ORDER: '🏪 Новый заказ для магазина',
  STORE_PREPARED: '📋 Заказ готов к выдаче'
};

// Функция отправки уведомления
function sendNotification(type, target, orderId, details = '') {
  const notification = {
    id: Date.now(),
    type: type,
    target: target, // 'courier' или 'store'
    orderId: orderId,
    details: details,
    timestamp: new Date().toLocaleString(),
    read: false
  };
  
  if (target === 'courier') {
    notifications.couriers.push(notification);
  } else if (target === 'store') {
    notifications.stores.push(notification);
  }
  
  saveNotifications();
  
  // Показываем всплывающее уведомление
  showToastNotification(type, details);
  
  // Обновляем счетчики в админке
  updateNotificationCounters();
}

// Сохранение уведомлений
function saveNotifications() {
  localStorage.setItem('artikFoodNotifications', JSON.stringify(notifications));
}

// Всплывающее уведомление (toast)
function showToastNotification(type, message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <strong>${type}</strong>
    <p>${message}</p>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  
  document.body.appendChild(toast);
  
  // Автоматическое скрытие через 5 секунд
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Обновление счетчиков уведомлений
function updateNotificationCounters() {
  const unreadCourier = notifications.couriers.filter(n => !n.read).length;
  const unreadStore = notifications.stores.filter(n => !n.read).length;
  
  // Обновляем в админ-панели
  const courierCounter = document.getElementById('courier-notif-count');
  const storeCounter = document.getElementById('store-notif-count');
  
  if (courierCounter) {
    courierCounter.textContent = unreadCourier > 0 ? ` (${unreadCourier})` : '';
  }
  if (storeCounter) {
    storeCounter.textContent = unreadStore > 0 ? ` (${unreadStore})` : '';
  }
}

// Отметить уведомление как прочитанное
function markAsRead(notificationId, target) {
  const list = target === 'courier' ? notifications.couriers : notifications.stores;
  const notification = list.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    saveNotifications();
    updateNotificationCounters();
    return true;
  }
  return false;
}

// Показать уведомления для курьеров
function showCourierNotifications() {
  const container = document.getElementById('courier-notifications-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const unread = notifications.couriers.filter(n => !n.read);
  const read = notifications.couriers.filter(n => n.read).slice(-10); // Последние 10 прочитанных
  
  if (unread.length === 0 && read.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#777;">Нет уведомлений</p>';
    return;
  }
  
  // Непрочитанные
  if (unread.length > 0) {
    const heading = document.createElement('h5');
    heading.textContent = 'Новые';
    heading.style.color = '#e74c3c';
    heading.style.marginTop = '15px';
    container.appendChild(heading);
    
    unread.forEach(notification => {
      const div = createNotificationElement(notification, 'courier');
      container.appendChild(div);
    });
  }
  
  // Прочитанные
  if (read.length > 0) {
    const heading = document.createElement('h5');
    heading.textContent = 'Ранее';
    heading.style.color = '#7f8c8d';
    heading.style.marginTop = '15px';
    container.appendChild(heading);
    
    read.forEach(notification => {
      const div = createNotificationElement(notification, 'courier');
      div.style.opacity = '0.7';
      container.appendChild(div);
    });
  }
}

// Показать уведомления для магазинов
function showStoreNotifications() {
  const container = document.getElementById('store-notifications-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const unread = notifications.stores.filter(n => !n.read);
  const read = notifications.stores.filter(n => n.read).slice(-10);
  
  if (unread.length === 0 && read.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#777;">Нет уведомлений</p>';
    return;
  }
  
  // Непрочитанные
  if (unread.length > 0) {
    const heading = document.createElement('h5');
    heading.textContent = 'Новые';
    heading.style.color = '#e74c3c';
    heading.style.marginTop = '15px';
    container.appendChild(heading);
    
    unread.forEach(notification => {
      const div = createNotificationElement(notification, 'store');
      container.appendChild(div);
    });
  }
  
  // Прочитанные
  if (read.length > 0) {
    const heading = document.createElement('h5');
    heading.textContent = 'Ранее';
    heading.style.color = '#7f8c8d';
    heading.style.marginTop = '15px';
    container.appendChild(heading);
    
    read.forEach(notification => {
      const div = createNotificationElement(notification, 'store');
      div.style.opacity = '0.7';
      container.appendChild(div);
    });
  }
}

// Создание элемента уведомления
function createNotificationElement(notification, target) {
  const div = document.createElement('div');
  div.className = 'notification-item';
  div.style.padding = '10px';
  div.style.marginBottom = '8px';
  div.style.background = notification.read ? '#f8f9fa' : '#fff3cd';
  div.style.border = notification.read ? '1px solid #ddd' : '1px solid #ffeaa7';
  div.style.borderRadius = '6px';
  div.style.cursor = 'pointer';
  div.style.position = 'relative';
  
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div style="flex: 1;">
        <strong>${notification.type}</strong>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
          ${notification.details}
        </p>
        <small style="color: #999;">${notification.timestamp}</small>
      </div>
      ${!notification.read ? 
        `<button onclick="markNotificationAsRead(${notification.id}, '${target}', event)" 
                style="background: #3498db; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer;">
          Прочитано
        </button>` : 
        '<span style="color: #27ae60; font-size: 12px;">✓ Прочитано</span>'
      }
    </div>
  `;
  
  return div;
}

// Функция для отметки прочитанным
function markNotificationAsRead(id, target, event) {
  event.stopPropagation();
  if (markAsRead(id, target)) {
    if (target === 'courier') {
      showCourierNotifications();
    } else {
      showStoreNotifications();
    }
  }
}

// Очистить все уведомления
function clearAllNotifications(target) {
  if (confirm(`Очистить все уведомления для ${target === 'courier' ? 'курьеров' : 'магазинов'}?`)) {
    if (target === 'courier') {
      notifications.couriers = [];
    } else {
      notifications.stores = [];
    }
    saveNotifications();
    updateNotificationCounters();
    
    if (target === 'courier') {
      showCourierNotifications();
    } else {
      showStoreNotifications();
    }
  }
}

// Обновить функцию отправки заказа для отправки уведомлений
function sendFormToWhatsApp() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const district = document.getElementById('district').value;
  const payment = document.getElementById('payment').value;
  const comment = document.getElementById('comment').value;

  let text = `🛒 Новый заказ Artik Food%0A%0A`;
  text += `👤 Имя: ${name}%0A`;
  text += `📞 Телефон: ${phone}%0A`;
  text += `📍 Адрес: ${address} (${district})%0A`;
  text += `💳 Оплата: ${payment}%0A`;
  if (comment) text += `💬 Комментарий: ${comment}%0A`;
  text += `%0A📦 Товары:%0A`;

  let goodsTotal = 0;
  Object.keys(carts).forEach(storeKey => {
    Object.entries(carts[storeKey]).forEach(([name, data]) => {
      if (data.qty > 0) {
        text += `- ${stores[storeKey].name}: ${name} × ${data.qty} = ${data.qty * data.price} AMD%0A`;
        goodsTotal += data.qty * data.price;
      }
    });
  });

  const delivery = district === "Артик" ? 500 : 
                   district === "Арич" ? 700 : 
                   district === "Нор-Кянк" ? 1000 : 
                   district === "Пемзашен" ? 1000 : 0;
  const total = goodsTotal + delivery;
  
  text += `%0A💰 Итого товары: ${goodsTotal} AMD%0A`;
  text += `🚚 Доставка: ${delivery} AMD%0A`;
  text += `💵 К оплате: ${total} AMD%0A%0A`;
  text += `_Заказ создан через сайт_`;

  // Сохраняем заказ
  const orderId = Date.now();
  const orderData = {
    name, phone, address, district, payment, comment,
    items: JSON.parse(JSON.stringify(carts)),
    total: total,
    delivery: delivery
  };
  
  saveOrder({
    ...orderData,
    id: orderId
  });

  // ===== ОТПРАВЛЯЕМ УВЕДОМЛЕНИЯ =====
  
  // 1. Уведомление для всех магазинов в заказе
  Object.keys(carts).forEach(storeKey => {
    sendNotification(
      NOTIFICATION_TYPES.STORE_NEW_ORDER,
      'store',
      orderId,
      `Новый заказ #${orderId} в магазин ${stores[storeKey].name}`
    );
  });
  
  // 2. Общее уведомление для курьеров
  sendNotification(
    NOTIFICATION_TYPES.NEW_ORDER,
    'courier',
    orderId,
    `Новый заказ #${orderId} на сумму ${total} AMD. Адрес: ${address} (${district})`
  );
  
  // 3. Уведомление в админку
  sendNotification(
    NOTIFICATION_TYPES.NEW_ORDER,
    'courier', // админу тоже как курьеру
    orderId,
    `Заказ #${orderId} от ${name}. Телефон: ${phone}`
  );
  // ================================

  window.open(`https://wa.me/37443797727?text=${text}`, '_blank');
  
  // Очищаем корзину после заказа
  carts = {};
  renderGlobalCart();
  if (currentStore) updateStoreCart();
  document.getElementById('order-form').reset();
  
  alert('Заказ отправлен! Ожидайте звонка оператора.');
}

// Обновить админ-панель для показа уведомлений
function updateAdminStats() {
  // ... существующий код ...
  
  // Добавляем уведомления в админку
  showCourierNotifications();
  showStoreNotifications();
  updateNotificationCounters();
}
