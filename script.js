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
