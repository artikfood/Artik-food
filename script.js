let currentStore = null;
let currentCategory = null;
let carts = {};
let orders = [];

/* ---------- ДАННЫЕ МАГАЗИНОВ ---------- */
const stores = {
  million: {
    name: "Million",
    products: [
      { name: "Картофель 1 кг", price: 300, category: "Овощи и фрукты" },
      { name: "Помидоры 1 кг", price: 450, category: "Овощи и фрукты" },
      { name: "Огурцы 1 кг", price: 400, category: "Овощи и фрукты" },
      { name: "Говядина 1 кг", price: 3200, category: "Мясо и рыба" },
      { name: "Курица 1 кг", price: 1800, category: "Мясо и рыба" },
      { name: "Молоко 1 л", price: 450, category: "Молочные продукты" },
      { name: "Сыр 300 г", price: 1200, category: "Молочные продукты" },
      { name: "Хлеб", price: 200, category: "Хлеб и выпечка" },
      { name: "Печенье", price: 500, category: "Сладости" },
      { name: "Сок 1 л", price: 550, category: "Напитки" },
      { name: "Макароны", price: 350, category: "Бакалея" },
      { name: "Порошок", price: 1200, category: "Бытовая химия" }
    ]
  },
  mush: {
    name: "Մուշ",
    products: [
      { name: "Яблоки 1 кг", price: 350, category: "Овощи и фрукты" },
      { name: "Бананы 1 кг", price: 600, category: "Овощи и фрукты" },
      { name: "Свинина 1 кг", price: 2900, category: "Мясо и рыба" },
      { name: "Рыба 1 кг", price: 2600, category: "Мясо и рыба" },
      { name: "Йогурт", price: 250, category: "Молочные продукты" },
      { name: "Масло сливочное", price: 900, category: "Молочные продукты" },
      { name: "Лаваш", price: 180, category: "Хлеб и выпечка" },
      { name: "Конфеты", price: 700, category: "Сладости" },
      { name: "Минеральная вода", price: 200, category: "Напитки" },
      { name: "Рис", price: 400, category: "Бакалея" },
      { name: "Моющее средство", price: 950, category: "Бытовая химия" }
    ]
  },
  tonoyan: {
    name: "Tonoyan",
    products: [
      { name: "Морковь 1 кг", price: 250, category: "Овощи и фрукты" },
      { name: "Капуста 1 кг", price: 200, category: "Овощи и фрукты" },
      { name: "Фарш 1 кг", price: 3000, category: "Мясо и рыба" },
      { name: "Котлеты", price: 1800, category: "Мясо и рыба" },
      { name: "Творог", price: 650, category: "Молочные продукты" },
      { name: "Кефир", price: 350, category: "Молочные продукты" },
      { name: "Булочки", price: 250, category: "Хлеб и выпечка" },
      { name: "Шоколад", price: 600, category: "Сладости" },
      { name: "Чай", price: 800, category: "Напитки" },
      { name: "Сахар", price: 350, category: "Бакалея" },
      { name: "Губки для посуды", price: 300, category: "Бытовая химия" }
    ]
  },
  danielyan: {
    name: "Danielyan",
    products: [
      { name: "Груши 1 кг", price: 500, category: "Овощи и фрукты" },
      { name: "Апельсины 1 кг", price: 550, category: "Овощи и фрукты" },
      { name: "Колбаса", price: 2800, category: "Мясо и рыба" },
      { name: "Сосиски", price: 1900, category: "Мясо и рыба" },
      { name: "Сметана", price: 450, category: "Молочные продукты" },
      { name: "Ряженка", price: 400, category: "Молочные продукты" },
      { name: "Батон", price: 220, category: "Хлеб и выпечка" },
      { name: "Торт", price: 2500, category: "Сладости" },
      { name: "Кола", price: 500, category: "Напитки" },
      { name: "Гречка", price: 450, category: "Бакалея" },
      { name: "Жидкость для мытья посуды", price: 1000, category: "Бытовая химия" }
    ]
  }
};

/* ---------- НАВИГАЦИЯ ---------- */

function hideAllPages() {
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('store-page').classList.add('hidden');
  document.getElementById('category-page').classList.add('hidden');
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('courier-panel').classList.add('hidden');
}

function goHome() {
  hideAllPages();
  document.getElementById('home-page').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (currentCategory && currentStore) {
    openStore(currentStore);
  } else if (currentStore) {
    goHome();
  } else {
    goHome();
  }
}

/* ---------- ОТОБРАЖЕНИЕ СУПЕРМАРКЕТОВ ---------- */

function renderShops() {
  const container = document.getElementById('shops-list');
  container.innerHTML = '';

  Object.keys(stores).forEach(key => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h4>${stores[key].name}</h4>`;
    div.onclick = () => openStore(key);
    container.appendChild(div);
  });
}

/* ---------- СУПЕРМАРКЕТ → КАТЕГОРИИ ---------- */

function openStore(storeKey) {
  currentStore = storeKey;
  currentCategory = null;

  hideAllPages();
  document.getElementById('store-page').classList.remove('hidden');
  document.getElementById('store-title').innerText = stores[storeKey].name;

  const container = document.getElementById('store-products');
  container.innerHTML = '';

  const categories = [...new Set(stores[storeKey].products.map(p => p.category))];

  categories.forEach(category => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerText = category;
    div.onclick = () => openStoreCategory(storeKey, category);
    container.appendChild(div);
  });

  document.getElementById('store-cart').classList.add('hidden');
}

/* ---------- КАТЕГОРИЯ → ТОВАРЫ (СПИСКОМ) ---------- */

function openStoreCategory(storeKey, categoryName) {
  currentStore = storeKey;
  currentCategory = categoryName;

  const container = document.getElementById('store-products');
  container.innerHTML = '';

  stores[storeKey].products.forEach(item => {
    if (item.category === categoryName) {
      const safeId = item.name.replace(/\s+/g, '');
      const qty = carts[storeKey]?.[item.name]?.qty || 0;

      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <div>
          <h4>${item.name}</h4>
          <p>${item.price} AMD</p>
        </div>
        <div class="qty-controls">
          <button onclick="changeQty('${storeKey}', '${item.name}', ${item.price}, -1)">−</button>
          <span class="qty-number" id="qty-${storeKey}-${safeId}">${qty}</span>
          <button onclick="changeQty('${storeKey}', '${item.name}', ${item.price}, 1)">+</button>
        </div>
      `;
      container.appendChild(div);
    }
  });

  document.getElementById('store-cart').classList.remove('hidden');
  updateStoreCartUI();
}

/* ---------- КОРЗИНА ---------- */

function changeQty(storeKey, productName, price, delta) {
  if (!carts[storeKey]) carts[storeKey] = {};
  if (!carts[storeKey][productName]) carts[storeKey][productName] = { qty: 0, price };

  carts[storeKey][productName].qty += delta;
  if (carts[storeKey][productName].qty < 0) carts[storeKey][productName].qty = 0;

  const safeId = productName.replace(/\s+/g, '');
  const qtyEl = document.getElementById(`qty-${storeKey}-${safeId}`);
  if (qtyEl) qtyEl.innerText = carts[storeKey][productName].qty;

  updateStoreCartUI();
  renderGlobalCart();
}

function updateStoreCartUI() {
  const container = document.getElementById('store-cart-items');
  const totalEl = document.getElementById('store-cart-total');
  container.innerHTML = '';

  let total = 0;

  Object.entries(carts[currentStore] || {}).forEach(([name, data]) => {
    if (data.qty > 0) {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span>${name} × ${data.qty}</span>
        <span>${data.qty * data.price} AMD</span>
      `;
      container.appendChild(div);
      total += data.qty * data.price;
    }
  });

  totalEl.innerText = `Итого: ${total} AMD`;
}

/* ---------- ГЛОБАЛЬНАЯ КОРЗИНА ---------- */

function renderGlobalCart() {
  const container = document.getElementById('global-cart-items');
  const totalEl = document.getElementById('global-cart-total');
  const deliveryEl = document.getElementById('delivery-total');
  const grandEl = document.getElementById('grand-total');

  container.innerHTML = '';

  let total = 0;

  Object.keys(carts).forEach(storeKey => {
    Object.entries(carts[storeKey]).forEach(([name, data]) => {
      if (data.qty > 0) {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <span>${stores[storeKey].name}: ${name} × ${data.qty}</span>
          <span>${data.qty * data.price} AMD</span>
        `;
        container.appendChild(div);
        total += data.qty * data.price;
      }
    });
  });

  totalEl.innerText = `Товары: ${total} AMD`;

  const district = document.getElementById('district').value;
  let delivery = 0;
  if (district === "Артик") delivery = 500;
  if (district === "Арич") delivery = 700;
  if (district === "Нор-Кянк") delivery = 1000;
  if (district === "Пемзашен") delivery = 1000;

  deliveryEl.innerText = `Доставка: ${delivery} AMD`;
  grandEl.innerText = `Итого: ${total + delivery} AMD`;
}

/* ---------- КАТАЛОГ (ГЛАВНАЯ КАТЕГОРИИ) ---------- */

function openCategory(categoryName) {
  hideAllPages();
  document.getElementById('category-page').classList.remove('hidden');
  document.getElementById('category-title').innerText = categoryName;

  const container = document.getElementById('category-products');
  container.innerHTML = '';

  Object.keys(stores).forEach(storeKey => {
    stores[storeKey].products.forEach(item => {
      if (item.category === categoryName) {
        const safeId = item.name.replace(/\s+/g, '');
        const qty = carts[storeKey]?.[item.name]?.qty || 0;

        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
          <div>
            <h4>${item.name}</h4>
            <p>${item.price} AMD — ${stores[storeKey].name}</p>
          </div>
          <div class="qty-controls">
            <button onclick="changeQty('${storeKey}', '${item.name}', ${item.price}, -1)">−</button>
            <span class="qty-number" id="qty-${storeKey}-${safeId}">${qty}</span>
            <button onclick="changeQty('${storeKey}', '${item.name}', ${item.price}, 1)">+</button>
          </div>
        `;
        container.appendChild(div);
      }
    });
  });

  renderGlobalCart();
}

/* ---------- ОТПРАВКА ЗАКАЗОВ ---------- */

function sendFormToWhatsApp() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const district = document.getElementById('district').value;
  const comment = document.getElementById('comment').value;

  let message = `🛒 Новый заказ:\nИмя: ${name}\nТелефон: ${phone}\nАдрес: ${address}\nРайон: ${district}\n\n`;

  let total = 0;
  Object.keys(carts).forEach(storeKey => {
    Object.entries(carts[storeKey]).forEach(([name, data]) => {
      if (data.qty > 0) {
        message += `${stores[storeKey].name}: ${name} × ${data.qty} = ${data.qty * data.price} AMD\n`;
        total += data.qty * data.price;
      }
    });
  });

  message += `\nИтого: ${total} AMD\nКомментарий: ${comment || '-'}`;

  window.open(`https://wa.me/37443797727?text=${encodeURIComponent(message)}`, '_blank');
}

/* ---------- МАГАЗИН → WHATSAPP / TELEGRAM ---------- */

function sendStoreToWhatsApp() {
  let message = `🛒 Заказ из ${stores[currentStore].name}:\n`;
  let total = 0;

  Object.entries(carts[currentStore] || {}).forEach(([name, data]) => {
    if (data.qty > 0) {
      message += `${name} × ${data.qty} = ${data.qty * data.price} AMD\n`;
      total += data.qty * data.price;
    }
  });

  message += `\nИтого: ${total} AMD`;
  window.open(`https://wa.me/37443797727?text=${encodeURIComponent(message)}`, '_blank');
}

function sendStoreToTelegram() {
  let message = `🛒 Заказ из ${stores[currentStore].name}:\n`;
  let total = 0;

  Object.entries(carts[currentStore] || {}).forEach(([name, data]) => {
    if (data.qty > 0) {
      message += `${name} × ${data.qty} = ${data.qty * data.price} AMD\n`;
      total += data.qty * data.price;
    }
  });

  message += `\nИтого: ${total} AMD`;
  window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(message)}`, '_blank');
}

/* ---------- АДМИН ---------- */

function openAdmin() {
  hideAllPages();
  document.getElementById('admin-login').classList.remove('hidden');
}

function loginAdmin() {
  const user = document.getElementById('admin-user').value;
  const pass = document.getElementById('admin-pass').value;

  if (user === "admin" && pass === "1234") {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminStores();
  } else {
    document.getElementById('admin-error').innerText = "Неверный логин или пароль";
  }
}

function logoutAdmin() {
  hideAllPages();
  goHome();
}

function loadAdminStores() {
  const select = document.getElementById('admin-store-select');
  select.innerHTML = '';

  Object.keys(stores).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.innerText = stores[key].name;
    select.appendChild(option);
  });

  loadAdminProducts();
}

function loadAdminProducts() {
  const storeKey = document.getElementById('admin-store-select').value;
  const container = document.getElementById('admin-products-list');
  container.innerHTML = '';

  stores[storeKey].products.forEach((product, index) => {
    const div = document.createElement('div');
    div.className = 'report-box';
    div.innerHTML = `
      <strong>${product.name}</strong> — ${product.price} AMD (${product.category})
      <button class="danger" onclick="deleteProduct('${storeKey}', ${index})">Удалить</button>
    `;
    container.appendChild(div);
  });
}

function addProduct() {
  const storeKey = document.getElementById('admin-store-select').value;
  const name = document.getElementById('new-product-name').value;
  const price = Number(document.getElementById('new-product-price').value);
  const category = document.getElementById('new-product-category').value;

  if (!name || !price || !category) return alert("Заполните все поля");

  stores[storeKey].products.push({ name, price, category });
  loadAdminProducts();
}

function deleteProduct(storeKey, index) {
  stores[storeKey].products.splice(index, 1);
  loadAdminProducts();
}

/* ---------- КУРЬЕР ---------- */

function openCourier() {
  hideAllPages();
  document.getElementById('courier-panel').classList.remove('hidden');
  renderCourierOrders();
}

function renderCourierOrders() {
  const container = document.getElementById('courier-orders');
  container.innerHTML = '<p>Пока заказов нет.</p>';
}

/* ---------- ИНИЦИАЛИЗАЦИЯ ---------- */

renderShops();
goHome();
