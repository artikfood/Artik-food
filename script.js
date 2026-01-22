// ===================
// ДАННЫЕ МАГАЗИНОВ
// ===================

const stores = {
  million: {
    name: "Million",
    products: [
      { name: "Картофель 1 кг", price: 300, category: "Овощи и фрукты" },
      { name: "Помидоры 1 кг", price: 600, category: "Овощи и фрукты" },
      { name: "Куриное филе 1 кг", price: 1500, category: "Мясо и рыба" },
      { name: "Молоко 1 л", price: 450, category: "Молочные продукты" },
      { name: "Хлеб белый", price: 200, category: "Хлеб и выпечка" },
      { name: "Сахар 1 кг", price: 450, category: "Бакалея" },
      { name: "Вода 1.5 л", price: 300, category: "Напитки" },
      { name: "Мыло", price: 250, category: "Бытовая химия" },
      { name: "Шоколад", price: 500, category: "Сладости" }
    ]
  },
  mush: {
    name: "Մուշ",
    products: [
      { name: "Яблоки 1 кг", price: 350, category: "Овощи и фрукты" },
      { name: "Огурцы 1 кг", price: 500, category: "Овощи и фрукты" },
      { name: "Говядина 1 кг", price: 2500, category: "Мясо и рыба" },
      { name: "Сыр 1 кг", price: 1800, category: "Молочные продукты" },
      { name: "Лаваш", price: 200, category: "Хлеб и выпечка" },
      { name: "Рис 1 кг", price: 600, category: "Бакалея" },
      { name: "Сок 1 л", price: 400, category: "Напитки" },
      { name: "Порошок", price: 900, category: "Бытовая химия" },
      { name: "Печенье", price: 450, category: "Сладости" }
    ]
  },
  tonoyan: {
    name: "Tonoyan",
    products: [
      { name: "Бананы 1 кг", price: 600, category: "Овощи и фрукты" },
      { name: "Капуста 1 кг", price: 250, category: "Овощи и фрукты" },
      { name: "Рыба свежая 1 кг", price: 2000, category: "Мясо и рыба" },
      { name: "Йогурт", price: 350, category: "Молочные продукты" },
      { name: "Булочка", price: 150, category: "Хлеб и выпечка" },
      { name: "Макароны", price: 400, category: "Бакалея" },
      { name: "Газировка", price: 350, category: "Напитки" },
      { name: "Губки", price: 200, category: "Бытовая химия" },
      { name: "Конфеты", price: 600, category: "Сладости" }
    ]
  },
  danielyan: {
    name: "Danielyan",
    products: [
      { name: "Груши 1 кг", price: 450, category: "Овощи и фрукты" },
      { name: "Морковь 1 кг", price: 250, category: "Овощи и фрукты" },
      { name: "Свинина 1 кг", price: 2300, category: "Мясо и рыба" },
      { name: "Творог", price: 700, category: "Молочные продукты" },
      { name: "Багет", price: 300, category: "Хлеб и выпечка" },
      { name: "Мука 1 кг", price: 400, category: "Бакалея" },
      { name: "Чай", price: 600, category: "Напитки" },
      { name: "Чистящее средство", price: 800, category: "Бытовая химия" },
      { name: "Торт", price: 3000, category: "Сладости" }
    ]
  },

  // 🌸 НОВЫЙ МАГАЗИН — ЭДЕМ
  edem: {
    name: "Эдем (цветы)",
    products: [
      { name: "Розы (букет)", price: 5000, category: "Сладости" },
      { name: "Тюльпаны (букет)", price: 3500, category: "Сладости" },
      { name: "Лилии (букет)", price: 7000, category: "Сладости" },
      { name: "Хризантемы", price: 4500, category: "Сладости" },
      { name: "Комнатное растение", price: 6000, category: "Сладости" },
      { name: "Открытка", price: 500, category: "Сладости" },
      { name: "Подарочная упаковка", price: 1000, category: "Сладости" }
    ]
  }
};

// ===================
// СОСТОЯНИЕ
// ===================

let currentStore = null;
let currentCategory = null;
let cart = JSON.parse(localStorage.getItem("cart")) || {};
let storeCart = {};

// ===================
// РЕНДЕР МАГАЗИНОВ
// ===================

function renderStores() {
  const container = document.getElementById("shops-list");
  container.innerHTML = "";
  Object.keys(stores).forEach(key => {
    const store = stores[key];
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = store.name;
    div.onclick = () => openStore(key);
    container.appendChild(div);
  });
}

// ===================
// НАВИГАЦИЯ
// ===================

function goHome() {
  hideAll();
  document.getElementById("home-page").classList.remove("hidden");
}

function goBack() {
  if (!document.getElementById("category-page").classList.contains("hidden")) {
    openStore(currentStore);
  } else if (!document.getElementById("store-page").classList.contains("hidden")) {
    goHome();
  }
}

function hideAll() {
  document.getElementById("home-page").classList.add("hidden");
  document.getElementById("store-page").classList.add("hidden");
  document.getElementById("category-page").classList.add("hidden");
  document.getElementById("admin-login").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("courier-panel").classList.add("hidden");
}

// ===================
// СТРАНИЦА МАГАЗИНА
// ===================

function openStore(storeKey) {
  currentStore = storeKey;
  storeCart = {};
  hideAll();
  document.getElementById("store-page").classList.remove("hidden");
  document.getElementById("store-title").innerText = stores[storeKey].name;
  renderStoreProducts();
}

function renderStoreProducts() {
  const container = document.getElementById("store-products");
  container.innerHTML = "";

  const products = stores[currentStore].products;

  products.forEach(product => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <strong>${product.name}</strong><br>
      <span>${product.price} AMD</span>
      <div class="qty-controls">
        <button onclick="changeQty('${product.name}', -1)">-</button>
        <span class="qty-number" id="qty-${product.name}">0</span>
        <button onclick="changeQty('${product.name}', 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// ===================
// КАТЕГОРИИ
// ===================

function openCategory(categoryName) {
  currentCategory = categoryName;
  hideAll();
  document.getElementById("category-page").classList.remove("hidden");
  document.getElementById("category-title").innerText = categoryName;
  renderCategoryProducts();
}

function renderCategoryProducts() {
  const container = document.getElementById("category-products");
  container.innerHTML = "";

  Object.keys(stores).forEach(storeKey => {
    stores[storeKey].products.forEach(product => {
      if (product.category === currentCategory) {
        const div = document.createElement("div");
        div.className = "product";
        div.innerHTML = `
          <strong>${product.name}</strong><br>
          <span>${product.price} AMD — ${stores[storeKey].name}</span>
          <div class="qty-controls">
            <button onclick="changeQty('${product.name}', -1)">-</button>
            <span class="qty-number" id="qty-${product.name}">0</span>
            <button onclick="changeQty('${product.name}', 1)">+</button>
          </div>
        `;
        container.appendChild(div);
      }
    });
  });
}

// ===================
// КОРЗИНА
// ===================

function changeQty(productName, delta) {
  const product = findProduct(productName);
  if (!product) return;

  if (!cart[productName]) cart[productName] = { ...product, qty: 0 };
  cart[productName].qty += delta;

  if (cart[productName].qty <= 0) delete cart[productName];

  document.getElementById(`qty-${productName}`).innerText = cart[productName]?.qty || 0;

  localStorage.setItem("cart", JSON.stringify(cart));
  renderGlobalCart();
  renderStoreCart();
}

function findProduct(name) {
  for (const storeKey in stores) {
    const product = stores[storeKey].products.find(p => p.name === name);
    if (product) return { ...product, store: stores[storeKey].name };
  }
  return null;
}

function renderGlobalCart() {
  const container = document.getElementById("global-cart-items");
  container.innerHTML = "";
  let total = 0;

  Object.values(cart).forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name} × ${item.qty}</span>
      <span>${itemTotal} AMD</span>
      <button onclick="removeFromCart('${item.name}')">✖</button>
    `;
    container.appendChild(div);
  });

  document.getElementById("global-cart-total").innerText = `Товары: ${total} AMD`;

  const district = document.getElementById("district")?.value || "";
  const deliveryPrices = {
    "Артик": 500,
    "Арич": 700,
    "Нор-Кянк": 1000,
    "Пемзашен": 1000
  };
  const delivery = deliveryPrices[district] || 0;

  document.getElementById("delivery-total").innerText = `Доставка: ${delivery} AMD`;
  document.getElementById("grand-total").innerText = `Итого: ${total + delivery} AMD`;
}

function removeFromCart(productName) {
  delete cart[productName];
  localStorage.setItem("cart", JSON.stringify(cart));
  renderGlobalCart();
}

// ===================
// КОРЗИНА МАГАЗИНА
// ===================

function renderStoreCart() {
  const container = document.getElementById("store-cart-items");
  const cartBox = document.getElementById("store-cart");
  container.innerHTML = "";
  let total = 0;

  Object.values(cart).forEach(item => {
    if (item.store === stores[currentStore].name) {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <span>${item.name} × ${item.qty}</span>
        <span>${itemTotal} AMD</span>
      `;
