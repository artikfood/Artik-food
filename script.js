let currentStore = null;
let currentCategory = null;
let carts = {};
let orders = [];

function hideAllPages() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
}

function showHome() {
  hideAllPages();
  document.getElementById('home-page').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openStore(storeKey) {
  currentStore = storeKey;
  currentCategory = null;

  hideAllPages();
  document.getElementById('store-page').classList.remove('hidden');

  document.getElementById('store-title').innerText = stores[storeKey].name;

  const container = document.getElementById('store-products');
  container.innerHTML = '';

  // Кнопка назад на главную
  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerText = '← Назад';
  backBtn.onclick = showHome;
  container.appendChild(backBtn);

  // Показываем категории магазина
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

function openStoreCategory(storeKey, categoryName) {
  currentStore = storeKey;
  currentCategory = categoryName;

  const container = document.getElementById('store-products');
  container.innerHTML = '';

  // Кнопка назад к категориям
  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerText = '← Назад к категориям';
  backBtn.onclick = () => openStore(storeKey);
  container.appendChild(backBtn);

  // Контейнер для товаров списком
  const list = document.createElement('div');
  list.className = 'products';

  stores[storeKey].products.forEach(item => {
    if (item.category === categoryName) {
      const safeId = item.name.replace(/\s+/g,'');
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
      list.appendChild(div);
    }
  });

  container.appendChild(list);
  document.getElementById('store-cart').classList.remove('hidden');
}

function changeQty(storeKey, productName, price, delta) {
  if (!carts[storeKey]) carts[storeKey] = {};
  if (!carts[storeKey][productName]) carts[storeKey][productName] = { qty: 0, price };

  carts[storeKey][productName].qty += delta;
  if (carts[storeKey][productName].qty < 0) carts[storeKey][productName].qty = 0;

  const safeId = productName.replace(/\s+/g,'');
  const qtyEl = document.getElementById(`qty-${storeKey}-${safeId}`);
  if (qtyEl) qtyEl.innerText = carts[storeKey][productName].qty;

  updateCartUI();
}

function updateCartUI() {
  const cartBox = document.getElementById('store-cart');
  if (!cartBox || !currentStore) return;

  cartBox.innerHTML = '<h4>Корзина</h4>';
  let total = 0;

  Object.entries(carts[currentStore] || {}).forEach(([name, data]) => {
    if (data.qty > 0) {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span>${name} × ${data.qty}</span>
        <span>${data.qty * data.price} AMD</span>
      `;
      cartBox.appendChild(div);
      total += data.qty * data.price;
    }
  });

  const totalDiv = document.createElement('div');
  totalDiv.className = 'cart-total';
  totalDiv.innerText = `Итого: ${total} AMD`;
  cartBox.appendChild(totalDiv);

  const btn = document.createElement('button');
  btn.innerText = 'Оформить заказ';
  btn.onclick = showOrderForm;
  cartBox.appendChild(btn);
}

function showOrderForm() {
  hideAllPages();
  document.getElementById('order-page').classList.remove('hidden');
}

function submitOrder() {
  const name = document.getElementById('order-name').value;
  const phone = document.getElementById('order-phone').value;
  const address = document.getElementById('order-address').value;
  const payment = document.getElementById('order-payment').value;

  const order = {
    name,
    phone,
    address,
    payment,
    store: currentStore,
    items: carts[currentStore],
    date: new Date().toLocaleString()
  };

  orders.push(order);
  carts[currentStore] = {};
  alert('Заказ отправлен!');

  showHome();
}
