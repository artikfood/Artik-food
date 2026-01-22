/* ================= DATA ================= */

let carts = JSON.parse(localStorage.getItem("carts")) || {};
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let currentStore = null;
let currentLang = localStorage.getItem("lang") || "ru";

const deliveryPrices = {
  "Артик": 500,
  "Арич": 700,
  "Нор-Кянк": 1000,
  "Пемзашен": 1000
};

const defaultStores = {
  million: {
    name: "Million",
    products: [
      { name: "Молоко 1л", price: 450, category: "Молочные продукты" },
      { name: "Йогурт", price: 350, category: "Молочные продукты" },
      { name: "Сыр 200г", price: 900, category: "Молочные продукты" },
      { name: "Творог", price: 500, category: "Молочные продукты" },
      { name: "Масло сливочное", price: 800, category: "Молочные продукты" },

      { name: "Хлеб белый", price: 200, category: "Хлеб и выпечка" },
      { name: "Хлеб чёрный", price: 220, category: "Хлеб и выпечка" },
      { name: "Лаваш", price: 180, category: "Хлеб и выпечка" },
      { name: "Булочка", price: 120, category: "Хлеб и выпечка" },

      { name: "Сахар 1кг", price: 420, category: "Бакалея" },
      { name: "Рис 1кг", price: 490, category: "Бакалея" },
      { name: "Макароны", price: 340, category: "Бакалея" },
      { name: "Масло подсолнечное", price: 650, category: "Бакалея" },

      { name: "Куриное филе", price: 1400, category: "Мясо и рыба" },
      { name: "Говядина", price: 2300, category: "Мясо и рыба" },
      { name: "Колбаса", price: 1200, category: "Мясо и рыба" },
      { name: "Сосиски", price: 900, category: "Мясо и рыба" },

      { name: "Яблоки 1кг", price: 350, category: "Овощи и фрукты" },
      { name: "Бананы 1кг", price: 480, category: "Овощи и фрукты" },
      { name: "Картофель 1кг", price: 250, category: "Овощи и фрукты" },
      { name: "Помидоры 1кг", price: 540, category: "Овощи и фрукты" },
      { name: "Огурцы 1кг", price: 500, category: "Овощи и фрукты" },

      { name: "Вода 1.5л", price: 200, category: "Напитки" },
      { name: "Сок апельсиновый", price: 450, category: "Напитки" },
      { name: "Кока-Кола 1л", price: 400, category: "Напитки" },
      { name: "Чай", price: 600, category: "Напитки" },
      { name: "Кофе", price: 1200, category: "Напитки" },

      { name: "Порошок стиральный", price: 1500, category: "Бытовая химия" },
      { name: "Средство для посуды", price: 700, category: "Бытовая химия" },
      { name: "Мыло", price: 300, category: "Бытовая химия" },
      { name: "Шампунь", price: 1100, category: "Бытовая химия" },

      { name: "Шоколад", price: 500, category: "Сладости" },
      { name: "Печенье", price: 450, category: "Сладости" },
      { name: "Конфеты", price: 800, category: "Сладости" },
      { name: "Вафли", price: 350, category: "Сладости" }
    ]
  },

  mush: {
    name: "Մուշ",
    products: [
      { name: "Молоко 1л", price: 430, category: "Молочные продукты" },
      { name: "Йогурт", price: 330, category: "Молочные продукты" },
      { name: "Сыр", price: 880, category: "Молочные продукты" },
      { name: "Сметана", price: 480, category: "Молочные продукты" },
      { name: "Кефир", price: 420, category: "Молочные продукты" },

      { name: "Хлеб", price: 190, category: "Хлеб и выпечка" },
      { name: "Лаваш", price: 200, category: "Хлеб и выпечка" },
      { name: "Булочка", price: 130, category: "Хлеб и выпечка" },

      { name: "Сахар 1кг", price: 410, category: "Бакалея" },
      { name: "Рис 1кг", price: 480, category: "Бакалея" },
      { name: "Макароны", price: 330, category: "Бакалея" },
      { name: "Масло подсолнечное", price: 640, category: "Бакалея" },

      { name: "Курица целая", price: 1600, category: "Мясо и рыба" },
      { name: "Говядина", price: 2250, category: "Мясо и рыба" },
      { name: "Колбаса", price: 1150, category: "Мясо и рыба" },

      { name: "Яблоки 1кг", price: 330, category: "Овощи и фрукты" },
      { name: "Бананы 1кг", price: 460, category: "Овощи и фрукты" },
      { name: "Картофель 1кг", price: 240, category: "Овощи и фрукты" },
      { name: "Лук 1кг", price: 190, category: "Овощи и фрукты" },
      { name: "Капуста 1кг", price: 220, category: "Овощи и фрукты" },

      { name: "Вода 1.5л", price: 190, category: "Напитки" },
      { name: "Сок яблочный", price: 430, category: "Напитки" },
      { name: "Газировка", price: 380, category: "Напитки" },

      { name: "Порошок", price: 1450, category: "Бытовая химия" },
      { name: "Средство для посуды", price: 680, category: "Бытовая химия" },
      { name: "Мыло", price: 280, category: "Бытовая химия" },

      { name: "Шоколад", price: 480, category: "Сладости" },
      { name: "Печенье", price: 420, category: "Сладости" },
      { name: "Конфеты", price: 780, category: "Сладости" }
    ]
  },

  tonoyan: {
    name: "Tonoyan",
    products: [
      { name: "Яблоки 1кг", price: 330, category: "Овощи и фрукты" },
      { name: "Бананы 1кг", price: 460, category: "Овощи и фрукты" },
      { name: "Апельсины 1кг", price: 520, category: "Овощи и фрукты" },
      { name: "Помидоры 1кг", price: 540, category: "Овощи и фрукты" },
      { name: "Огурцы 1кг", price: 500, category: "Овощи и фрукты" },
      { name: "Картофель 1кг", price: 240, category: "Овощи и фрукты" },
      { name: "Лук 1кг", price: 190, category: "Овощи и фрукты" },
      { name: "Капуста 1кг", price: 220, category: "Овощи и фрукты" },
      { name: "Зелень", price: 150, category: "Овощи и фрукты" },
      { name: "Грибы", price: 700, category: "Овощи и фрукты" }
    ]
  },

  danielyan: {
    name: "Danielyan",
    products: [
      { name: "Торт шоколадный", price: 2500, category: "Сладости" },
      { name: "Торт ванильный", price: 2400, category: "Сладости" },
      { name: "Эклер", price: 300, category: "Сладости" },
      { name: "Наполеон", price: 2800, category: "Сладости" },
      { name: "Круассан", price: 250, category: "Сладости" },
      { name: "Маффин", price: 350, category: "Сладости" },
      { name: "Пахлава", price: 400, category: "Сладости" },
      { name: "Печенье ассорти", price: 1500, category: "Сладости" }
    ]
  }
};

let stores = JSON.parse(localStorage.getItem("stores")) || defaultStores;

/* ================= LANGUAGE ================= */

const translations = {
  ru: {
    nav_home: "Главная",
    nav_order: "Заказать",
    nav_contacts: "Контакты",
    nav_admin: "Админ",
    nav_courier: "Курьер",

    hero_title: "Доставка продуктов в Артике",
    hero_subtitle: "Свежие продукты из супермаркетов — прямо к вашей двери",
    hero_btn: "Заказать сейчас",

    shops_title: "Супермаркеты",
    categories_title: "Категории товаров",

    cat_veg: "Овощи и фрукты",
    cat_meat: "Мясо и рыба",
    cat_dairy: "Молочные продукты",
    cat_bread: "Хлеб и выпечка",
    cat_grocery: "Бакалея",
    cat_drinks: "Напитки",
    cat_clean: "Бытовая химия",
    cat_sweets: "Сладости",

    cart_global: "Корзина (все магазины)",
    cart_store: "Корзина этого магазина",

    btn_whatsapp_store: "Заказать из этого магазина (WhatsApp)",
    btn_telegram_store: "Заказать из этого магазина (Telegram)",

    order_title: "Оформление заказа",
    order_send: "Отправить заказ",

    contacts_title: "Контакты",
    contacts_phone_label: "Телефон / WhatsApp:",
    contacts_city: "Артик, Ширак, Армения",

    footer_text: "Доставка продуктов в Артике",

    btn_back: "Назад",
    btn_home: "Главная",

    admin_login_title: "Вход в админ панель",
    admin_login_btn: "Войти",
    admin_panel_title: "Админ панель",
    admin_select_store: "Выберите супермаркет:",
    admin_add_product: "Добавить новый товар",
    admin_add_btn: "Добавить товар",
    admin_orders_report: "Отчёт по заказам",
    admin_logout: "Выйти из админки",

    courier_title: "Панель курьера",
    courier_back: "Вернуться на главную"
  },

  am: {
    nav_home: "Գլխավոր",
    nav_order: "Պատվիրել",
    nav_contacts: "Կոնտակտներ",
    nav_admin: "Ադմին",
    nav_courier: "Առաքիչ",

    hero_title: "Մթերքի առաքում Արթիկում",
    hero_subtitle: "Թարմ մթերք սուպերմարկետներից՝ ուղիղ Ձեր տուն",
    hero_btn: "Պատվիրել հիմա",

    shops_title: "Սուպերմարկետներ",
    categories_title: "Ապրանքների կատեգորիաներ",

    cat_veg: "Բանջարեղեն և մրգեր",
    cat_meat: "Միս և ձուկ",
    cat_dairy: "Կաթնամթերք",
    cat_bread: "Հաց և խմորեղեն",
    cat_grocery: "Մթերք",
    cat_drinks: "Խմիչքներ",
    cat_clean: "Կենցաղային քիմիա",
    cat_sweets: "Քաղցրավենիք",

    cart_global: "Զամբյուղ (բոլոր խանութները)",
    cart_store: "Այս խանութի զամբյուղը",

    btn_whatsapp_store: "Պատվիրել այս խանութից (WhatsApp)",
    btn_telegram_store: "Պատվիրել այս խանութից (Telegram)",

    order_title: "Պատվերի ձևակերպում",
    order_send: "Ուղարկել պատվերը",

    contacts_title: "Կոնտակտներ",
    contacts_phone_label: "Հեռախոս / WhatsApp:",
    contacts_city: "Արթիկ, Շիրակ, Հայաստան",

    footer_text: "Մթերքի առաքում Արթիկում",

    btn_back: "Հետ",
    btn_home: "Գլխավոր",

    admin_login_title: "Մուտք ադմին վահանակ",
    admin_login_btn: "Մուտք",
    admin_panel_title: "Ադմին վահանակ",
    admin_select_store: "Ընտրեք սուպերմարկետը:",
    admin_add_product: "Ավելացնել նոր ապրանք",
    admin_add_btn: "Ավելացնել ապրանք",
    admin_orders_report: "Պատվերների հաշվետվություն",
    admin_logout: "Դուրս գալ ադմինից",

    courier_title: "Առաքչի վահանակ",
    courier_back: "Վերադառնալ գլխավոր էջ"
  }
};

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) {
      el.innerText = translations[currentLang][key];
    }
  });
  localStorage.setItem("lang", currentLang);
}

function switchLang() {
  currentLang = currentLang === "ru" ? "am" : "ru";
  applyLanguage();
}

/* ================= CORE LOGIC ================= */

function saveStores() { localStorage.setItem("stores", JSON.stringify(stores)); }
function saveCarts() { localStorage.setItem("carts", JSON.stringify(carts)); }

function renderShops() {
  const container = document.getElementById("shops-list");
  container.innerHTML = "";
  Object.keys(stores).forEach(key => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = "🛒 " + stores[key].name;
    div.onclick = () => openStore(key);
    container.appendChild(div);
  });
}

/* ====== ИЗМЕНЁННАЯ ЛОГИКА ОТКРЫТИЯ МАГАЗИНА ====== */

function openStore(storeKey) {
  currentStore = storeKey;

  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('category-page').classList.add('hidden');
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('courier-panel').classList.add('hidden');
  document.getElementById('store-page').classList.remove('hidden');

  document.getElementById('store-title').innerText = stores[storeKey].name;

  const container = document.getElementById('store-products');
  container.innerHTML = '';

  const categories = [...new Set(stores[storeKey].products.map(p => p.category))];

  categories.forEach(category => {
    const div = document.createElement('div');
    div.className = 'product'; // используем твой существующий стиль
    div.innerHTML = `<h4>${category}</h4>`;
    div.onclick = () => openStoreCategory(storeKey, category);
    container.appendChild(div);
  });

  document.getElementById('store-cart').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openStoreCategory(storeKey, categoryName) {
  currentStore = storeKey;

  const container = document.getElementById('store-products');
  container.innerHTML = '';

  stores[storeKey].products.forEach(item => {
    if (item.category === categoryName) {
      const safeId = item.name.replace(/\s+/g,'');
      const qty = carts[storeKey]?.[item.name]?.qty || 0;

      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <h4>${item.name}</h4>
        <p>Цена: ${item.price} AMD</p>
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
}

/* ====== ОСТАЛЬНОЙ КОД — БЕЗ ИЗМЕНЕНИЙ ====== */

function goHome() {
  document.getElementById('store-page').classList.add('hidden');
  document.getElementById('category-page').classList.add('hidden');
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('courier-panel').classList.add('hidden');
  document.getElementById('home-page').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() { window.history.back(); }

function changeQty(storeKey, name, price, delta) {
  if (!carts[storeKey]) carts[storeKey] = {};
  if (!carts[storeKey][name]) carts[storeKey][name] = { price, qty: 0 };

  carts[storeKey][name].qty += delta;
  if (carts[storeKey][name].qty <= 0) {
    delete carts[storeKey][name];
  }

  updateQtyDisplay(storeKey, name);
  renderStoreCart(storeKey);
  renderGlobalCart();
  saveCarts();
}

function updateQtyDisplay(storeKey, name) {
  const safeId = name.replace(/\s+/g,'');
  const id = `qty-${storeKey}-${safeId}`;
  const el = document.getElementById(id);
  if (el) el.innerText = carts[storeKey]?.[name]?.qty || 0;
}

function removeItem(storeKey, name) {
  if (carts[storeKey] && carts[storeKey][name]) {
    delete carts[storeKey][name];
    renderStoreCart(storeKey);
    renderGlobalCart();
    saveCarts();
  }
}

function renderStoreCart(storeKey) {
  const container = document.getElementById("store-cart-items");
  container.innerHTML = "";
  let total = 0;

  const storeCart = carts[storeKey] || {};
  Object.keys(storeCart).forEach(name => {
    const item = storeCart[name];
    const sum = item.price * item.qty;
    total += sum;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${name} × ${item.qty}</span>
      <span>${sum} AMD</span>
      <button onclick="removeItem('${storeKey}', '${name}')" style="color:red;border:none;background:none;cursor:pointer;">❌</button>
    `;
    container.appendChild(div);
  });

  document.getElementById("store-cart-total").innerText = `Итого: ${total} AMD`;
}

function renderGlobalCart() {
  const container = document.getElementById("global-cart-items");
  container.innerHTML = "";
  let total = 0;

  Object.keys(carts).forEach(storeKey => {
    const storeName = stores[storeKey].name;
    const storeCart = carts[storeKey];

    if (storeCart && Object.keys(storeCart).length > 0) {
      const storeTitle = document.createElement("div");
      storeTitle.innerHTML = `<strong>${storeName}</strong>`;
      storeTitle.style.marginTop = "10px";
      container.appendChild(storeTitle);

      Object.keys(storeCart).forEach(name => {
        const item = storeCart[name];
        const sum = item.price * item.qty;
        total += sum;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <span>${name} × ${item.qty}</span>
          <span>${sum} AMD</span>
          <button onclick="removeItem('${storeKey}', '${name}')" style="color:red;border:none;background:none;cursor:pointer;">❌</button>
        `;
        container.appendChild(div);
      });
    }
  });

  const district = document.getElementById("district")?.value || "";
  const deliveryCost = deliveryPrices[district] || 0;

  document.getElementById("global-cart-total").innerText = `Товары: ${total} AMD`;
  document.getElementById("delivery-total").innerText = `Доставка: ${deliveryCost} AMD`;
  document.getElementById("grand-total").innerText = `Итого: ${total + deliveryCost} AMD`;
}

/* ================= ORDERS & MESSAGING ================= */

function sendStoreToWhatsApp() {
  if (!currentStore || !carts[currentStore] || Object.keys(carts[currentStore]).length === 0) {
    alert("Корзина этого магазина пуста");
    return;
  }

  let message = `Здравствуйте! Хочу заказать из магазина ${stores[currentStore].name}:%0A`;
  let total = 0;

  Object.keys(carts[currentStore]).forEach(name => {
    const item = carts[currentStore][name];
    const sum = item.price * item.qty;
    message += `- ${name} × ${item.qty}: ${sum} AMD%0A`;
    total += sum;
  });

  message += `%0AИтого: ${total} AMD`;
  saveOrder(stores[currentStore].name, carts[currentStore], total, "Новый");

  window.open(`https://wa.me/37443797727?text=${message}`, '_blank');
}

function sendStoreToTelegram() {
  if (!currentStore || !carts[currentStore] || Object.keys(carts[currentStore]).length === 0) {
    alert("Корзина этого магазина пуста");
    return;
  }

  let message = `Здравствуйте! Хочу заказать из магазина ${stores[currentStore].name}:%0A`;
  let total = 0;

  Object.keys(carts[currentStore]).forEach(name => {
    const item = carts[currentStore][name];
    const sum = item.price * item.qty;
    message += `- ${name} × ${item.qty}: ${sum} AMD%0A`;
    total += sum;
  });

  message += `%0AИтого: ${total} AMD`;
  saveOrder(stores[currentStore].name, carts[currentStore], total, "Новый");

  window.open(`https://t.me/artikfood?text=${message}`, '_blank');
}

function sendFormToWhatsApp() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const comment = document.getElementById('comment').value;
  const district = document.getElementById('district').value;

  const deliveryCost = deliveryPrices[district] || 0;

  let message = `Здравствуйте!%0AИмя: ${name}%0AТелефон: ${phone}%0AАдрес: ${address}%0AРайон: ${district}%0AСтоимость доставки: ${deliveryCost} AMD`;

  let total = deliveryCost;

  Object.keys(carts).forEach(storeKey => {
    const storeCart = carts[storeKey];
    if (storeCart && Object.keys(storeCart).length > 0) {
      message += `%0A%0AМагазин ${stores[storeKey].name}:`;
      Object.keys(storeCart).forEach(name => {
        const item = storeCart[name];
        const sum = item.price * item.qty;
        message += `%0A- ${name} × ${item.qty}: ${sum} AMD`;
        total += sum;
      });
    }
  });

  message += `%0A%0AИтого с доставкой: ${total} AMD`;

  saveOrder("Смешанный заказ", carts, total, "Новый");

  window.open(`https://wa.me/37443797727?text=${message}`, '_blank');
}

function saveOrder(storeName, items, total, status) {
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    store: storeName,
    items: JSON.parse(JSON.stringify(items)),
    total,
    status: status || "Новый"
  };
  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));
  renderOrdersReport();
  renderCourierOrders();
}

/* ================= CATEGORY ================= */

function openCategory(categoryName) {
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('store-page').classList.add('hidden');
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('courier-panel').classList.add('hidden');
  document.getElementById('category-page').classList.remove('hidden');
  document.getElementById('category-title').innerText = categoryName;

  const container = document.getElementById('category-products');
  container.innerHTML = '';

  Object.keys(stores).forEach(storeKey => {
    const store = stores[storeKey];
    store.products.forEach(item => {
      if (item.category === categoryName) {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
          <h4>${item.name}</h4>
          <p>Цена: ${item.price} AMD</p>
          <p style="font-size:12px;color:#777;">Магазин: ${store.name}</p>
          <button onclick="openStore('${storeKey}')">Перейти в магазин</button>
        `;
        container.appendChild(div);
      }
    });
  });
}

/* ================= ADMIN ================= */

function openAdmin() {
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('store-page').classList.add('hidden');
  document.getElementById('category-page').classList.add('hidden');
  document.getElementById('courier-panel').classList.add('hidden');
  document.getElementById('admin-login').classList.remove('hidden');
}

function loginAdmin() {
  const user = document.getElementById('admin-user').value;
  const pass = document.getElementById('admin-pass').value;
  if (user === "admin" && pass === "1234") {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminStores();
    renderOrdersReport();
  } else {
    document.getElementById('admin-error').innerText = "Неверный логин или пароль";
  }
}

function logoutAdmin() {
  document.getElementById('admin-panel').classList.add('hidden');
  goHome();
}

function loadAdminStores() {
  const select = document.getElementById("admin-store-select");
  select.innerHTML = "";
  Object.keys(stores).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.text = stores[key].name;
    select.appendChild(option);
  });
  loadAdminProducts();
}

function loadAdminProducts() {
  const storeKey = document.getElementById("admin-store-select").value;
  const list = document.getElementById("admin-products-list");
  list.innerHTML = "";

  stores[storeKey].products.forEach((item, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <input type="text" value="${item.name}" onchange="editProductName('${storeKey}', ${index}, this.value)" />
      <input type="number" value="${item.price}" onchange="editProductPrice('${storeKey}', ${index}, this.value)" />
      <input type="text" value="${item.category}" onchange="editProductCategory('${storeKey}', ${index}, this.value)" />
      <button class="danger" onclick="deleteProduct('${storeKey}', ${index})">Удалить</button>
      <hr/>
    `;
    list.appendChild(div);
  });
}

function editProductName(storeKey, index, value) {
  stores[storeKey].products[index].name = value;
  saveStores();
}

function editProductPrice(storeKey, index, value) {
  stores[storeKey].products[index].price = Number(value);
  saveStores();
}

function editProductCategory(storeKey, index, value) {
  stores[storeKey].products[index].category = value;
  saveStores();
}

function deleteProduct(storeKey, index) {
  stores[storeKey].products.splice(index, 1);
  saveStores();
  loadAdminProducts();
}

function addProduct() {
  const storeKey = document.getElementById("admin-store-select").value;
  const name = document.getElementById("new-product-name").value;
  const price = Number(document.getElementById("new-product-price").value);
  const category = document.getElementById("new-product-category").value;

  if (!name || price < 0 || !category) {
    alert("Введите корректные данные");
    return;
  }

  stores[storeKey].products.push({ name, price, category });
  saveStores();
  document.getElementById("new-product-name").value = "";
  document.getElementById("new-product-price").value = "";
  document.getElementById("new-product-category").value = "";
  loadAdminProducts();
}

function renderOrdersReport() {
  const container = document.getElementById("orders-report");
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = "<p>Заказов пока нет.</p>";
    return;
  }

  orders.forEach((order, index) => {
    const div = document.createElement("div");
    div.className = "report-box";

    let itemsText = "";
    Object.keys(order.items).forEach(storeKey => {
      const storeCart = order.items[storeKey];
      if (storeCart && typeof storeCart === "object") {
        itemsText += `<strong>${stores[storeKey]?.name || storeKey}:</strong><br/>`;
        Object.keys(storeCart).forEach(name => {
          const item = storeCart[name];
          itemsText += `- ${name} × ${item.qty} = ${item.price * item.qty} AMD<br/>`;
        });
      }
    });

    div.innerHTML = `
      <strong>Заказ #${index + 1}</strong><br/>
      Дата: ${order.date}<br/>
      Магазин: ${order.store}<br/>
      Сумма: ${order.total} AMD<br/>
      Статус:
      <select onchange="updateOrderStatus(${order.id}, this.value)">
        <option ${order.status === "Новый" ? "selected" : ""}>Новый</option>
        <option ${order.status === "Принят" ? "selected" : ""}>Принят</option>
        <option ${order.status === "В пути" ? "selected" : ""}>В пути</option>
        <option ${order.status === "Доставлен" ? "selected" : ""}>Доставлен</option>
      </select>
      <div>${itemsText}</div>
    `;
    container.appendChild(div);
  });
}

function updateOrderStatus(orderId, status) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    localStorage.setItem("orders", JSON.stringify(orders));
    renderCourierOrders();
  }
}

/* ================= COURIER ================= */

function openCourier() {
  document.getElementById('home-page').classList.add('hidden');
  document.getElementById('store-page').classList.add('hidden');
  document.getElementById('category-page').classList.add('hidden');
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('courier-panel').classList.remove('hidden');
  renderCourierOrders();
}

function renderCourierOrders() {
  const container = document.getElementById("courier-orders");
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = "<p>Заказов пока нет.</p>";
    return;
  }

  orders.forEach(order => {
    const div = document.createElement("div");
    div.className = "report-box";

    let itemsText = "";
    Object.keys(order.items).forEach(storeKey => {
      const storeCart = order.items[storeKey];
      if (storeCart && typeof storeCart === "object") {
        itemsText += `<strong>${stores[storeKey]?.name || storeKey}:</strong><br/>`;
        Object.keys(storeCart).forEach(name => {
          const item = storeCart[name];
          itemsText += `- ${name} × ${item.qty}<br/>`;
        });
      }
    });

    div.innerHTML = `
      <strong>Заказ #${order.id}</strong><br/>
      Адрес: ${document.getElementById("address")?.value || "—"}<br/>
      Сумма: ${order.total} AMD<br/>
      Статус: <strong>${order.status}</strong><br/>
      <div>${itemsText}</div>
      <button onclick="updateOrderStatus(${order.id}, 'В пути')">В пути</button>
      <button onclick="updateOrderStatus(${order.id}, 'Доставлен')" style="background:#0088cc;">Доставлен</button>
    `;
    container.appendChild(div);
  });
}

/* ================= INIT ================= */

renderShops();
renderGlobalCart();
applyLanguage();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
