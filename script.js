/* ========== УЛУЧШЕННАЯ СИСТЕМА ОПОВЕЩЕНИЙ (JavaScript) ========== */

// Пароль для админки
const ADMIN_PASSWORD = "artik123";

// Хранилище данных
let orders = JSON.parse(localStorage.getItem('artikFoodOrders')) || [];
let couriers = JSON.parse(localStorage.getItem('artikFoodCouriers')) || [];
let notifications = JSON.parse(localStorage.getItem('artikFoodNotifications')) || {
  couriers: [],
  stores: []
};

// Типы уведомлений с приоритетами
const NOTIFICATION_TYPES = {
  NEW_ORDER: { text: '🆕 Новый заказ', priority: 1 },
  ORDER_ACCEPTED: { text: '✅ Заказ принят', priority: 2 },
  ORDER_DELIVERED: { text: '📦 Заказ доставлен', priority: 2 },
  ORDER_CANCELLED: { text: '❌ Заказ отменен', priority: 1 },
  ASSIGNED_TO_COURIER: { text: '🚴 Назначен курьеру', priority: 1 },
  PAYMENT_RECEIVED: { text: '💰 Оплата получена', priority: 2 },
  STORE_NEW_ORDER: { text: '🏪 Новый заказ для магазина', priority: 1 },
  STORE_PREPARED: { text: '📋 Заказ готов к выдаче', priority: 1 },
  URGENT_ORDER: { text: '🚨 Срочный заказ', priority: 0 }
};

/* ========== ОСНОВНЫЕ ФУНКЦИИ ========== */

// Функция сохранения уведомлений
function saveNotifications() {
  localStorage.setItem('artikFoodNotifications', JSON.stringify(notifications));
}

// Функция сохранения заказа
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

// Обновление счетчиков уведомлений
function updateNotificationCounters() {
  const unreadCourier = notifications.couriers.filter(n => !n.read).length;
  const unreadStore = notifications.stores.filter(n => !n.read).length;
  
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

// Функция для отметки прочитанным (для обработки событий)
function markNotificationAsRead(id, target, event) {
  if (event) event.stopPropagation();
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

// Автоматическая очистка старых уведомлений
function autoCleanupNotifications() {
  const MAX_NOTIFICATIONS_PER_TYPE = 100;
  const DAYS_TO_KEEP = 7;
  const now = new Date();
  
  const cleanupList = (list) => {
    const recent = list.filter(notification => {
      const notificationDate = new Date(notification.timestamp);
      const diffDays = (now - notificationDate) / (1000 * 60 * 60 * 24);
      return diffDays <= DAYS_TO_KEEP;
    });
    return recent.slice(-MAX_NOTIFICATIONS_PER_TYPE);
  };
  
  notifications.couriers = cleanupList(notifications.couriers);
  notifications.stores = cleanupList(notifications.stores);
  
  saveNotifications();
}

// Функция отправки уведомления с улучшениями
function sendNotification(typeKey, target, orderId, details = '', isUrgent = false) {
  const notificationType = isUrgent ? NOTIFICATION_TYPES.URGENT_ORDER : NOTIFICATION_TYPES[typeKey];
  
  if (!notificationType) {
    console.error('Неизвестный тип уведомления:', typeKey);
    return;
  }
  
  const notification = {
    id: Date.now(),
    type: notificationType.text,
    priority: notificationType.priority,
    target: target,
    orderId: orderId,
    details: details,
    timestamp: new Date().toLocaleString(),
    read: false,
    urgent: isUrgent
  };
  
  // Добавляем в начало для высокоприоритетных уведомлений
  if (notification.priority <= 1) {
    if (target === 'courier') {
      notifications.couriers.unshift(notification);
    } else if (target === 'store') {
      notifications.stores.unshift(notification);
    }
  } else {
    if (target === 'courier') {
      notifications.couriers.push(notification);
    } else if (target === 'store') {
      notifications.stores.push(notification);
    }
  }
  
  saveNotifications();
  
  // Воспроизводим звук
  playNotificationSound(isUrgent);
  
  // Показываем всплывающее уведомление
  if (isUrgent) {
    showUrgentToast(notification.type, details);
  } else {
    showToastNotification(notification.type, details);
  }
  
  // Обновляем счетчики
  updateNotificationCounters();
  
  // Обновляем список уведомлений в админке
  if (document.getElementById('admin-panel') && 
      !document.getElementById('admin-panel').classList.contains('hidden')) {
    if (target === 'courier') {
      showCourierNotifications();
    } else {
      showStoreNotifications();
    }
  }
}

// Воспроизведение звука уведомления
function playNotificationSound(isUrgent) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (isUrgent) {
      // Срочный звук (высокая частота, 3 сигнала)
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1200;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }, i * 250);
      }
    } else {
      // Обычный звук
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  } catch (error) {
    console.log('Звуковые уведомления не поддерживаются');
  }
}

// Срочное всплывающее уведомление
function showUrgentToast(type, message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification urgent';
  toast.innerHTML = `
    <strong style="color: #e74c3c;">${type}</strong>
    <p>${message}</p>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  
  document.body.appendChild(toast);
  
  // Мигание для срочных уведомлений
  let blinkCount = 0;
  const blinkInterval = setInterval(() => {
    toast.style.backgroundColor = blinkCount % 2 === 0 ? '#ffeaa7' : '#ffcccc';
    blinkCount++;
    if (blinkCount >= 6) {
      clearInterval(blinkInterval);
      toast.style.backgroundColor = '#ffcccc';
    }
  }, 500);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 10000);
}

// Обычное всплывающее уведомление
function showToastNotification(type, message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <strong>${type}</strong>
    <p>${message}</p>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  
  document.body.appendChild(toast);
  
  // Анимация появления
  toast.style.animation = 'slideIn 0.3s ease';
  
  // Автоматическое скрытие через 5 секунд
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Создание элемента уведомления
function createNotificationElement(notification, target) {
  const div = document.createElement('div');
  div.className = 'notification-item';
  div.style.padding = '10px';
  div.style.marginBottom = '8px';
  div.style.background = notification.read ? '#f8f9fa' : 
                        notification.urgent ? '#ffcccc' : '#fff3cd';
  div.style.border = notification.read ? '1px solid #ddd' : 
                    notification.urgent ? '2px solid #e74c3c' : '1px solid #ffeaa7';
  div.style.borderRadius = '6px';
  div.style.cursor = 'pointer';
  div.style.position = 'relative';
  
  // Добавляем индикатор приоритета
  const priorityColor = notification.priority === 0 ? '#e74c3c' : 
                       notification.priority === 1 ? '#f39c12' : '#3498db';
  
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div style="flex: 1; position: relative; padding-left: 8px; border-left: 3px solid ${priorityColor}">
        <strong>${notification.type}</strong>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
          ${notification.details}
        </p>
        <small style="color: #999;">${notification.timestamp}</small>
        ${notification.urgent ? '<span style="color: #e74c3c; font-size: 10px; margin-left: 5px;">🚨 СРОЧНО</span>' : ''}
      </div>
      ${!notification.read ? 
        `<button onclick="markNotificationAsRead(${notification.id}, '${target}', event)" 
                style="background: #3498db; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; white-space: nowrap;">
          Прочитано
        </button>` : 
        '<span style="color: #27ae60; font-size: 12px; white-space: nowrap;">✓ Прочитано</span>'
      }
    </div>
  `;
  
  // Добавляем обработчик клика на все уведомление
  div.onclick = (e) => {
    if (e.target.tagName !== 'BUTTON') {
      markNotificationAsRead(notification.id, target, e);
    }
  };
  
  return div;
}

// Показать уведомления для курьеров
function showCourierNotifications() {
  const container = document.getElementById('courier-notifications-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const unread = notifications.couriers.filter(n => !n.read);
  const read = notifications.couriers.filter(n => n.read).slice(-10);
  
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

// Добавление CSS стилей
function addNotificationStyles() {
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
        100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
      }
      
      .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 300px;
      }
      
      .toast-notification.urgent {
        background-color: #ffcccc;
        border: 2px solid #e74c3c;
        animation: pulse 2s infinite;
      }
      
      .toast-notification strong {
        display: block;
        margin-bottom: 5px;
      }
      
      .toast-notification p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .toast-notification button {
        position: absolute;
        top: 5px;
        right: 5px;
        background: transparent;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
      }
      
      .toast-notification button:hover {
        color: #333;
      }
      
      .notification-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// Функция определения срочности заказа
function determineIfUrgent(orderData) {
  const total = orderData.total || 0;
  const district = orderData.district || '';
  const hour = new Date().getHours();
  
  return total > 10000 || 
         district.includes('Центр') || 
         (hour >= 12 && hour <= 14) || 
         (hour >= 18 && hour <= 20);
}

/* ========== АДМИН-ПАНЕЛЬ ========== */

function showAdminLogin() {
  const password = prompt("Введите пароль администратора:");
  if (password === ADMIN_PASSWORD) {
    showAdminPanel();
  } else if (password) {
    alert("Неверный пароль");
  }
}

function showAdminPanel() {
  // Скрываем кнопки доступа
  const accessButtons = document.getElementById('admin-access-buttons');
  if (accessButtons) {
    accessButtons.style.display = 'none';
  }
  
  // Показываем панель входа
  const adminPanel = document.getElementById('admin-panel');
  if (adminPanel) {
    adminPanel.classList.remove('hidden');
    adminPanel.style.display = 'block';
  } else {
    // Если панель не существует в HTML, создаем её динамически
    createAdminPanel();
  }
  
  updateAdminStats();
}

function hideAdminPanel() {
  const adminPanel = document.getElementById('admin-panel');
  if (adminPanel) {
    adminPanel.classList.add('hidden');
    adminPanel.style.display = 'none';
  }
  
  // Показываем кнопки доступа
  const accessButtons = document.getElementById('admin-access-buttons');
  if (accessButtons) {
    accessButtons.style.display = 'flex';
  }
}

function updateAdminStats() {
  // Статистика за сегодня
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.date).toDateString() === today
  );
  
  const todayOrdersElem = document.getElementById('today-orders');
  const todayAmountElem = document.getElementById('today-amount');
  const activeCouriersElem = document.getElementById('active-couriers');
  const totalOrdersElem = document.getElementById('total-orders');
  
  if (todayOrdersElem) {
    todayOrdersElem.textContent = todayOrders.length;
  }
  if (todayAmountElem) {
    todayAmountElem.textContent = todayOrders.reduce((sum, order) => sum + order.total, 0);
  }
  if (activeCouriersElem) {
    activeCouriersElem.textContent = couriers.filter(c => c.status === 'active').length;
  }
  if (totalOrdersElem) {
    totalOrdersElem.textContent = orders.length;
  }
  
  // Последние заказы
  const recentOrdersContainer = document.getElementById('recent-orders');
  if (recentOrdersContainer) {
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
  }
  
  // Список курьеров
  const couriersContainer = document.getElementById('couriers-list');
  if (couriersContainer) {
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
  
  // Показываем уведомления
  showCourierNotifications();
  showStoreNotifications();
  updateNotificationCounters();
}

// Создание админ-панели
function createAdminPanel() {
  const adminPanel = document.createElement('div');
  adminPanel.id = 'admin-panel';
  adminPanel.style.position = 'fixed';
  adminPanel.style.top = '0';
  adminPanel.style.left = '0';
  adminPanel.style.width = '100%';
  adminPanel.style.height = '100%';
  adminPanel.style.background = 'white';
  adminPanel.style.zIndex = '1000';
  adminPanel.style.overflowY = 'auto';
  adminPanel.style.padding = '20px';
  
  adminPanel.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #eee;">
        <h1 style="margin: 0;">👑 Панель администратора</h1>
        <button onclick="hideAdminPanel()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
          ✕ Выход
        </button>
      </div>
      
      <!-- Блок статистики -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;" id="today-orders">0</div>
          <div>Заказов сегодня</div>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;" id="today-amount">0</div>
          <div>Выручка сегодня</div>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;" id="active-couriers">0</div>
          <div>Активных курьеров</div>
        </div>
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold;" id="total-orders">0</div>
          <div>Всего заказов</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <!-- Левая колонка -->
        <div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">📋 Последние заказы</h3>
            <div id="recent-orders" style="max-height: 300px; overflow-y: auto;"></div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="margin: 0;">🚴 Управление курьерами</h3>
              <button onclick="addCourier()" style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                + Добавить курьера
              </button>
            </div>
            <div id="couriers-list" style="max-height: 300px; overflow-y: auto;"></div>
          </div>
        </div>
        
        <!-- Правая колонка -->
        <div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="margin: 0;">🔔 Уведомления для курьеров <span id="courier-notif-count"></span></h3>
              <div>
                <button onclick="clearAllNotifications('courier')" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 10px;">
                  Очистить все
                </button>
              </div>
            </div>
            <div id="courier-notifications-list" style="max-height: 300px; overflow-y: auto;"></div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="margin: 0;">🏪 Уведомления для магазинов <span id="store-notif-count"></span></h3>
              <div>
                <button onclick="clearAllNotifications('store')" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                  Очистить все
                </button>
              </div>
            </div>
            <div id="store-notifications-list" style="max-height: 300px; overflow-y: auto;"></div>
          </div>
        </div>
      </div>
      
      <!-- Кнопки управления -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; display: flex; gap: 10px; justify-content: center;">
        <button onclick="viewAllOrders()" style="padding: 12px 25px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
          📊 Все заказы
        </button>
        <button onclick="addNewProduct()" style="padding: 12px 25px; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer;">
          ➕ Добавить товар
        </button>
        <button onclick="backupData()" style="padding: 12px 25px; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer;">
          💾 Резервная копия
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(adminPanel);
}

// Функции управления курьерами
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

// Другие функции админки
function addNewProduct() {
  alert("Здесь будет добавление новых товаров.");
}

function viewAllOrders() {
  alert("Всего заказов: " + orders.length + 
        "\nНа сумму: " + orders.reduce((sum, o) => sum + o.total, 0) + " AMD");
}

function backupData() {
  const data = {
    orders: orders,
    couriers: couriers,
    notifications: notifications,
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `artikfood_backup_${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  
  alert('Резервная копия создана и скачана!');
}

/* ========== КНОПКИ ДОСТУПА ========== */

function addAdminAndCourierButtons() {
  // Проверяем, есть ли уже кнопки
  if (document.getElementById('admin-access-buttons')) return;
  
  // Создаем контейнер для кнопок
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'admin-access-buttons';
  buttonContainer.style.position = 'fixed';
  buttonContainer.style.top = '10px';
  buttonContainer.style.right = '10px';
  buttonContainer.style.zIndex = '999';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.flexDirection = 'column';
  
  // Кнопка входа в админку
  const adminButton = document.createElement('button');
  adminButton.id = 'admin-login-btn-main';
  adminButton.innerHTML = '👑 Админ';
  adminButton.style.padding = '8px 15px';
  adminButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  adminButton.style.color = 'white';
  adminButton.style.border = 'none';
  adminButton.style.borderRadius = '25px';
  adminButton.style.cursor = 'pointer';
  adminButton.style.fontWeight = 'bold';
  adminButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
  adminButton.onclick = showAdminLogin;
  
  // Кнопка меню курьера
  const courierButton = document.createElement('button');
  courierButton.id = 'courier-menu-btn';
  courierButton.innerHTML = '🚴 Курьер';
  courierButton.style.padding = '8px 15px';
  courierButton.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  courierButton.style.color = 'white';
  courierButton.style.border = 'none';
  courierButton.style.borderRadius = '25px';
  courierButton.style.cursor = 'pointer';
  courierButton.style.fontWeight = 'bold';
  courierButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
  courierButton.onclick = showCourierLogin;
  
  // Добавляем кнопки в контейнер
  buttonContainer.appendChild(adminButton);
  buttonContainer.appendChild(courierButton);
  
  // Добавляем контейнер на страницу
  document.body.appendChild(buttonContainer);
}

/* ========== ПАНЕЛЬ КУРЬЕРА ========== */

function showCourierLogin() {
  const courierId = prompt("Введите ID или телефон курьера:");
  
  if (!courierId) return;
  
  const courier = couriers.find(c => c.id == courierId || c.phone === courierId);
  
  if (courier) {
    showCourierPanel(courier);
  } else {
    alert("Курьер не найден. Пожалуйста, обратитесь к администратору.");
  }
}

function showCourierPanel(courier) {
  // Скрываем кнопки доступа
  document.getElementById('admin-access-buttons').style.display = 'none';
  
  // Создаем панель курьера
  const courierPanel = document.createElement('div');
  courierPanel.id = 'courier-panel';
  courierPanel.style.position = 'fixed';
  courierPanel.style.top = '0';
  courierPanel.style.left = '0';
  courierPanel.style.width = '100%';
  courierPanel.style.height = '100%';
  courierPanel.style.background = 'white';
  courierPanel.style.zIndex = '1000';
  courierPanel.style.overflowY = 'auto';
  courierPanel.style.padding = '20px';
  
  // Заголовок
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  header.style.paddingBottom = '15px';
  header.style.borderBottom = '2px solid #eee';
  
  header.innerHTML = `
    <div>
      <h2 style="margin: 0; color: #333;">🚴 Панель курьера</h2>
      <p style="margin: 5px 0 0 0; color: #666;">${courier.name} | ${courier.phone}</p>
      <p style="margin: 0; font-size: 12px; color: #999;">Статус: ${courier.status === 'active' ? '🟢 Активен' : '🔴 Неактивен'}</p>
    </div>
    <button onclick="exitCourierPanel()" style="padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
      Выход
    </button>
  `;
  
  // Вкладки
  const tabs = document.createElement('div');
  tabs.style.display = 'flex';
  tabs.style.gap = '10px';
  tabs.style.marginBottom = '20px';
  tabs.style.borderBottom = '1px solid #ddd';
  tabs.style.paddingBottom = '10px';
  
  tabs.innerHTML = `
    <button onclick="showCourierTab('orders')" id="courier-tab-orders" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px 5px 0 0; cursor: pointer;">
      📦 Мои заказы
    </button>
    <button onclick="showCourierTab('notifications')" id="courier-tab-notifications" style="padding: 10px 20px; background: #f8f9fa; color: #333; border: none; border-radius: 5px 5px 0 0; cursor: pointer;">
      🔔 Уведомления
    </button>
    <button onclick="showCourierTab('stats')" id="courier-tab-stats" style="padding: 10px 20px; background: #f8f9fa; color: #333; border: none; border-radius: 5px 5px 0 0; cursor: pointer;">
      📊 Статистика
    </button>
  `;
  
  // Контейнер для содержимого
  const tabContent = document.createElement('div');
  tabContent.id = 'courier-tab-content';
  tabContent.style.padding = '20px';
  tabContent.style.background = '#f8f9fa';
  tabContent.style.borderRadius = '5px';
  tabContent.style.minHeight = '400px';
  
  // Собираем панель
  courierPanel.appendChild(header);
  courierPanel.appendChild(tabs);
  courierPanel.appendChild(tabContent);
  
  document.body.appendChild(courierPanel);
  
  // Показываем первую вкладку
  showCourierTab('orders');
}

function exitCourierPanel() {
  const panel = document.getElementById('courier-panel');
  if (panel) panel.remove();
  
  const accessButtons = document.getElementById('admin-access-buttons');
  if (accessButtons) accessButtons.style.display = 'flex';
}

function showCourierTab(tabName) {
  // Обновляем активную кнопку
  document.querySelectorAll('#courier-panel button[id^="courier-tab-"]').forEach(btn => {
    btn.style.background = '#f8f9fa';
    btn.style.color = '#333';
  });
  
  const activeBtn = document.getElementById(`courier-tab-${tabName}`);
  if (activeBtn) {
    activeBtn.style.background = '#3498db';
    activeBtn.style.color = 'white';
  }
  
  const tabContent = document.getElementById('courier-tab-content');
  
  switch(tabName) {
    case 'orders':
      showCourierOrders();
      break;
    case 'notifications':
      showCourierNotificationsTab();
      break;
    case 'stats':
      showCourierStats();
      break;
  }
}

function showCourierOrders() {
  const tabContent = document.getElementById('courier-tab-content');
  
  // Находим текущего курьера
  const courierPanel = document.getElementById('courier-panel');
  const courierName = courierPanel ? courierPanel.querySelector('p').textContent.split('|')[0].trim() : '';
  
  // Находим заказы этого курьера
  const courierOrders = orders.filter(order => order.courier && order.courier.includes(courierName));
  
  let html = `
    <h3 style="margin-top: 0;">📦 Мои заказы</h3>
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button onclick="refreshCourierOrders()" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
        🔄 Обновить
      </button>
    </div>
  `;
  
  if (courierOrders.length === 0) {
    html += `
      <div style="text-align: center; padding: 40px; color: #777; background: white; border-radius: 5px;">
        <p style="font-size: 18px; margin-bottom: 10px;">😴 Нет активных заказов</p>
        <p>Ожидайте назначения новых заказов</p>
      </div>
    `;
  } else {
    html += '<div style="display: flex; flex-direction: column; gap: 15px;">';
    
    courierOrders.forEach(order => {
      const statusColors = {
        'new': '#3498db',
        'assigned': '#f39c12',
        'delivering': '#9b59b6',
        'delivered': '#2ecc71',
        'cancelled': '#e74c3c'
      };
      
      const statusText = {
        'new': 'Новый',
        'assigned': 'Назначен',
        'delivering': 'В доставке',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен'
      };
      
      const status = order.status || 'new';
      const statusColor = statusColors[status] || '#95a5a6';
      
      html += `
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid ${statusColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h4 style="margin: 0 0 5px 0;">Заказ #${order.id}</h4>
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">${order.name} • ${order.phone}</p>
              <p style="margin: 0; font-size: 13px; color: #999;">${order.address} (${order.district})</p>
            </div>
            <div style="text-align: right;">
              <span style="background: ${statusColor}; color: white; padding: 3px 10px; border-radius: 15px; font-size: 12px;">
                ${statusText[status] || status}
              </span>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #2c3e50;">${order.total} AMD</p>
            </div>
          </div>
          <div style="margin-top: 15px; display: flex; gap: 10px;">
            ${status === 'assigned' ? `
              <button onclick="updateOrderStatus(${order.id}, 'delivering')" style="padding: 8px 15px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                🚴 Начать доставку
              </button>
            ` : ''}
            ${status === 'delivering' ? `
              <button onclick="updateOrderStatus(${order.id}, 'delivered')" style="padding: 8px 15px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                ✅ Доставлено
              </button>
            ` : ''}
            <button onclick="viewOrderDetails(${order.id})" style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              👁️ Подробности
            </button>
            <button onclick="callCustomer('${order.phone}')" style="padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              📞 Позвонить
            </button>
          </div>
          ${order.comment ? `
            <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
              <strong>💬 Комментарий:</strong> ${order.comment}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  tabContent.innerHTML = html;
}

function showCourierNotificationsTab() {
  const tabContent = document.getElementById('courier-tab-content');
  
  const courierNotifications = notifications.couriers || [];
  
  let html = `
    <h3 style="margin-top: 0;">🔔 Мои уведомления</h3>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <button onclick="refreshCourierNotifications()" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
          🔄 Обновить
        </button>
        <button onclick="markAllNotificationsAsRead()" style="padding: 5px 10px; background: #2ecc71; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px;">
          ✅ Все прочитано
        </button>
      </div>
      <span style="font-size: 12px; color: #666;">
        Непрочитанных: <strong>${courierNotifications.filter(n => !n.read).length}</strong>
      </span>
    </div>
  `;
  
  if (courierNotifications.length === 0) {
    html += `
      <div style="text-align: center; padding: 40px; color: #777; background: white; border-radius: 5px;">
        <p style="font-size: 18px; margin-bottom: 10px;">📭 Нет уведомлений</p>
        <p>Все уведомления будут отображаться здесь</p>
      </div>
    `;
  } else {
    const unread = courierNotifications.filter(n => !n.read);
    const read = courierNotifications.filter(n => n.read).slice(-10);
    
    if (unread.length > 0) {
      html += '<h4 style="color: #e74c3c; margin-bottom: 10px;">Новые</h4>';
      html += '<div style="margin-bottom: 20px;">';
      
      unread.forEach(notification => {
        html += `
          <div style="background: #fff3cd; padding: 12px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #ffeaa7;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>${notification.type || 'Уведомление'}</strong>
                <p style="margin: 5px 0; font-size: 13px;">${notification.details || ''}</p>
                <small style="color: #999;">${notification.timestamp || ''}</small>
              </div>
              <button onclick="markNotificationAsRead(${notification.id}, 'courier')" style="padding: 4px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                Прочитано
              </button>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    if (read.length > 0) {
      html += '<h4 style="color: #7f8c8d; margin-bottom: 10px;">Ранее</h4>';
      html += '<div style="opacity: 0.7;">';
      
      read.forEach(notification => {
        html += `
          <div style="background: #f8f9fa; padding: 10px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #ddd;">
            <div>
              <strong>${notification.type || 'Уведомление'}</strong>
              <p style="margin: 5px 0; font-size: 13px;">${notification.details || ''}</p>
              <small style="color: #999;">${notification.timestamp || ''}</small>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    }
  }
  
  tabContent.innerHTML = html;
}

function showCourierStats() {
  const tabContent = document.getElementById('courier-tab-content');
  
  // Находим текущего курьера
  const courierPanel = document.getElementById('courier-panel');
  const courierName = courierPanel ? courierPanel.querySelector('p').textContent.split('|')[0].trim() : '';
  
  const courierOrders = orders.filter(order => order.courier && order.courier.includes(courierName));
  const today = new Date().toDateString();
  const todayOrders = courierOrders.filter(order => 
    new Date(order.date).toDateString() === today
  );
  
  const completedOrders = courierOrders.filter(order => 
    order.status === 'delivered'
  );
  
  const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.total * 0.1), 0);
  
  const html = `
    <h3 style="margin-top: 0;">📊 Моя статистика</h3>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold;">${courierOrders.length}</div>
        <div>Всего заказов</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold;">${todayOrders.length}</div>
        <div>Сегодня</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold;">${completedOrders.length}</div>
        <div>Доставлено</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold;">${Math.round(totalEarnings)}</div>
        <div>Заработок (AMD)</div>
      </div>
    </div>
    
    <h4>📈 История заказов</h4>
    <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
      ${
        completedOrders.length === 0 ? 
        '<p style="text-align: center; color: #777; padding: 20px;">Нет данных о доставленных заказах</p>' :
        completedOrders.slice(-5).reverse().map(order => `
          <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
            <div>
              <strong>Заказ #${order.id}</strong><br>
              <small>${order.address} • ${order.date}</small>
            </div>
            <div style="text-align: right;">
              <strong>${order.total} AMD</strong><br>
              <small style="color: #27ae60;">+${Math.round(order.total * 0.1)} AMD</small>
            </div>
          </div>
        `).join('')
      }
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #e8f4fc; border-radius: 8px;">
      <h4 style="margin-top: 0;">💡 Советы</h4>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Всегда звоните клиенту перед выездом</li>
        <li>Проверяйте адрес доставки на карте</li>
        <li>Сообщайте о проблемах администратору</li>
        <li>Соблюдайте сроки доставки</li>
      </ul>
    </div>
  `;
  
  tabContent.innerHTML = html;
}

/* ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ========== */

function updateOrderStatus(orderId, newStatus) {
  const orderIndex = orders.findIndex(order => order.id == orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    orders[orderIndex].statusDate = new Date().toLocaleString();
    localStorage.setItem('artikFoodOrders', JSON.stringify(orders));
    
    const statusText = {
      'delivering': 'доставке',
      'delivered': 'доставлен',
      'cancelled': 'отменен'
    };
    
    sendNotification(
      newStatus === 'delivered' ? 'ORDER_DELIVERED' : 'ORDER_ACCEPTED',
      'courier',
      orderId,
      `Заказ #${orderId} ${statusText[newStatus] || 'обновлен'}`
    );
    
    alert(`Статус заказа обновлен на: ${newStatus}`);
    showCourierOrders();
  }
}

function viewOrderDetails(orderId) {
  const order = orders.find(o => o.id == orderId);
  
  if (order) {
    let itemsText = '';
    if (order.items) {
      Object.entries(order.items).forEach(([storeKey, items]) => {
        Object.entries(items).forEach(([itemName, itemData]) => {
          if (itemData.qty > 0) {
            itemsText += `${itemName} × ${itemData.qty} = ${itemData.qty * itemData.price} AMD\n`;
          }
        });
      });
    }
    
    alert(
      `📋 Детали заказа #${orderId}\n\n` +
      `👤 Имя: ${order.name}\n` +
      `📞 Телефон: ${order.phone}\n` +
      `📍 Адрес: ${order.address} (${order.district})\n` +
      `💰 Сумма: ${order.total} AMD\n` +
      `🚚 Доставка: ${order.delivery || 0} AMD\n` +
      `💳 Оплата: ${order.payment || 'не указано'}\n\n` +
      `🛒 Товары:\n${itemsText || 'Нет информации'}\n\n` +
      `💬 Комментарий: ${order.comment || 'нет'}\n` +
      `📅 Дата: ${order.date}\n` +
      `📊 Статус: ${order.status || 'новый'}`
    );
  }
}

function callCustomer(phone) {
  if (confirm(`Позвонить клиенту: ${phone}?`)) {
    window.open(`tel:${phone}`);
  }
}

function markAllNotificationsAsRead() {
  notifications.couriers.forEach(notification => {
    notification.read = true;
  });
  
  saveNotifications();
  showCourierNotificationsTab();
}

function refreshCourierOrders() {
  showCourierOrders();
}

function refreshCourierNotifications() {
  showCourierNotificationsTab();
}

/* ========== ИНИЦИАЛИЗАЦИЯ ========== */

document.addEventListener('DOMContentLoaded', function() {
  // Загружаем данные
  const savedOrders = localStorage.getItem('artikFoodOrders');
  const savedCouriers = localStorage.getItem('artikFoodCouriers');
  
  if (savedOrders) orders = JSON.parse(savedOrders);
  if (savedCouriers) {
    couriers = JSON.parse(savedCouriers);
    if (couriers.length > 0) {
      nextCourierId = Math.max(...couriers.map(c => c.id)) + 1;
    }
  }
  
  // Добавляем CSS стили
  addNotificationStyles();
  
  // Очищаем старые уведомления
  autoCleanupNotifications();
  
  // Добавляем кнопки доступа
  addAdminAndCourierButtons();
  
  // Обновляем счетчики
  updateNotificationCounters();
});
