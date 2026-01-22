/* ========== УЛУЧШЕННАЯ СИСТЕМА ОПОВЕЩЕНИЙ (JavaScript) ========== */

// Хранилище уведомлений
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

// Автоматическая очистка старых уведомлений
function autoCleanupNotifications() {
  const MAX_NOTIFICATIONS_PER_TYPE = 100;
  const DAYS_TO_KEEP = 7;
  const now = new Date();
  
  const cleanupList = (list) => {
    // Удаляем уведомления старше 7 дней
    const recent = list.filter(notification => {
      const notificationDate = new Date(notification.timestamp);
      const diffDays = (now - notificationDate) / (1000 * 60 * 60 * 24);
      return diffDays <= DAYS_TO_KEEP;
    });
    
    // Оставляем только последние MAX_NOTIFICATIONS_PER_TYPE
    return recent.slice(-MAX_NOTIFICATIONS_PER_TYPE);
  };
  
  notifications.couriers = cleanupList(notifications.couriers);
  notifications.stores = cleanupList(notifications.stores);
  
  saveNotifications();
}

// Функция отправки уведомления с улучшениями
function sendNotification(typeKey, target, orderId, details = '', isUrgent = false) {
  const notificationType = isUrgent ? NOTIFICATION_TYPES.URGENT_ORDER : NOTIFICATION_TYPES[typeKey];
  
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
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (isUrgent) {
      // Срочный звук (высокая частота, 3 сигнала)
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const urgentOsc = audioContext.createOscillator();
          const urgentGain = audioContext.createGain();
          
          urgentOsc.connect(urgentGain);
          urgentGain.connect(audioContext.destination);
          
          urgentOsc.frequency.value = 1200;
          urgentOsc.type = 'sine';
          
          urgentGain.gain.setValueAtTime(0.5, audioContext.currentTime);
          urgentGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          urgentOsc.start(audioContext.currentTime);
          urgentOsc.stop(audioContext.currentTime + 0.2);
        }, i * 250);
      }
    } else {
      // Обычный звук
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

// Обычное всплывающее уведомление (обновленная версия)
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

// Группировка уведомлений
function showGroupedNotifications(target) {
  const containerId = target === 'courier' ? 'courier-notifications-list' : 'store-notifications-list';
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  const notificationList = target === 'courier' ? notifications.couriers : notifications.stores;
  const unread = notificationList.filter(n => !n.read);
  const read = notificationList.filter(n => n.read);
  
  // Группируем непрочитанные по типу
  const groupedUnread = unread.reduce((groups, notification) => {
    const type = notification.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(notification);
    return groups;
  }, {});
  
  // Создаем аккордеон для каждой группы
  Object.entries(groupedUnread).forEach(([type, notificationsList]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'notification-group';
    groupDiv.style.marginBottom = '15px';
    groupDiv.style.border = '1px solid #ddd';
    groupDiv.style.borderRadius = '8px';
    groupDiv.style.overflow = 'hidden';
    
    const header = document.createElement('div');
    header.className = 'group-header';
    header.style.padding = '10px 15px';
    header.style.background = '#f8f9fa';
    header.style.cursor = 'pointer';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.fontWeight = 'bold';
    header.style.borderBottom = '1px solid #ddd';
    
    header.innerHTML = `
      <span>${type} <span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${notificationsList.length}</span></span>
      <span class="toggle-group">▼</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'group-content';
    content.style.display = 'none';
    content.style.padding = '10px';
    
    notificationsList.forEach(notification => {
      const div = createNotificationElement(notification, target);
      content.appendChild(div);
    });
    
    header.onclick = () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      header.querySelector('.toggle-group').textContent = isHidden ? '▲' : '▼';
    };
    
    groupDiv.appendChild(header);
    groupDiv.appendChild(content);
    container.appendChild(groupDiv);
  });
  
  // Показываем прочитанные
  if (read.length > 0) {
    const heading = document.createElement('h5');
    heading.textContent = 'Ранее';
    heading.style.color = '#7f8c8d';
    heading.style.marginTop = '20px';
    heading.style.marginBottom = '10px';
    container.appendChild(heading);
    
    read.slice(-10).forEach(notification => {
      const div = createNotificationElement(notification, target);
      div.style.opacity = '0.7';
      container.appendChild(div);
    });
  }
}

// Обновленная функция показа уведомлений для курьеров
function showCourierNotifications() {
  const container = document.getElementById('courier-notifications-list');
  if (!container) return;
  
  // Проверяем, есть ли кнопка переключения режима
  const toggleBtn = document.getElementById('toggle-grouping-btn');
  
  if (toggleBtn && toggleBtn.textContent.includes('Группировать')) {
    // Показываем с группировкой
    showGroupedNotifications('courier');
  } else {
    // Показываем без группировки (старый способ)
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
}

// Обновленная функция показа уведомлений для магазинов
function showStoreNotifications() {
  const container = document.getElementById('store-notifications-list');
  if (!container) return;
  
  // Проверяем, есть ли кнопка переключения режима
  const toggleBtn = document.getElementById('toggle-grouping-btn-stores');
  
  if (toggleBtn && toggleBtn.textContent.includes('Группировать')) {
    // Показываем с группировкой
    showGroupedNotifications('store');
  } else {
    // Показываем без группировки (старый способ)
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
}

// Обновленное создание элемента уведомления
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

// Добавьте эти CSS анимации в ваш стиль
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

// Обновленная функция отправки заказа
function sendFormToWhatsApp() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const district = document.getElementById('district').value;
  const payment = document.getElementById('payment').value;
  const comment = document.getElementById('comment').value;

  // ... существующий код формирования текста для WhatsApp ...

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

  // ===== ОТПРАВЛЯЕМ УЛУЧШЕННЫЕ УВЕДОМЛЕНИЯ =====
  
  // Определяем срочность заказа
  const isUrgentOrder = determineIfUrgent(orderData);
  
  // 1. Уведомление для всех магазинов в заказе
  Object.keys(carts).forEach(storeKey => {
    sendNotification(
      'STORE_NEW_ORDER',
      'store',
      orderId,
      `Новый заказ #${orderId} в магазин ${stores[storeKey].name} на сумму ${total} AMD`,
      isUrgentOrder
    );
  });
  
  // 2. Общее уведомление для курьеров
  sendNotification(
    'NEW_ORDER',
    'courier',
    orderId,
    `Новый заказ #${orderId} на сумму ${total} AMD. Адрес: ${address} (${district}). Оплата: ${payment}`,
    isUrgentOrder
  );
  
  // 3. Уведомление в админку
  sendNotification(
    'NEW_ORDER',
    'courier', // админу тоже как курьеру
    orderId,
    `Заказ #${orderId} от ${name}. Телефон: ${phone}. Сумма: ${total} AMD`,
    isUrgentOrder
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

// Функция определения срочности заказа
function determineIfUrgent(orderData) {
  // Логика определения срочного заказа
  // Например: большой заказ, центральный район, определенное время и т.д.
  const total = orderData.total || 0;
  const district = orderData.district || '';
  const hour = new Date().getHours();
  
  return total > 10000 || 
         district.includes('Центр') || 
         (hour >= 12 && hour <= 14) || // обеденное время
         (hour >= 18 && hour <= 20);   // вечернее время
}

// Инициализация системы уведомлений при загрузке
document.addEventListener('DOMContentLoaded', function() {
  // Добавляем CSS стили
  addNotificationStyles();
  
  // Очищаем старые уведомления
  autoCleanupNotifications();
  
  // Создаем кнопки переключения режима группировки (если админка есть)
  if (document.getElementById('courier-notifications-list')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-grouping-btn';
    toggleBtn.textContent = 'Группировать уведомления';
    toggleBtn.style.margin = '10px 0';
    toggleBtn.style.padding = '5px 10px';
    toggleBtn.style.fontSize = '12px';
    toggleBtn.onclick = () => {
      if (toggleBtn.textContent.includes('Группировать')) {
        toggleBtn.textContent = 'Показывать по порядку';
        showCourierNotifications();
      } else {
        toggleBtn.textContent = 'Группировать уведомления';
        showCourierNotifications();
      }
    };
    
    const container = document.getElementById('courier-notifications-list');
    if (container && container.parentNode) {
      container.parentNode.insertBefore(toggleBtn, container);
    }
  }
  
  // Обновляем счетчики
  updateNotificationCounters();
});
