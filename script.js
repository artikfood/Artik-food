// ========== КОНСТАНТЫ И ПЕРЕМЕННЫЕ ==========
const ADMIN_PASSWORD = "artik123";
const ADMIN_PHONE = "+37443797727";
const WHATSAPP_NUMBER = "37443797727";

// Данные магазинов и продуктов
const stores = {
    million: {
        name: "Million",
        logo: "🛒",
        color: "#3498db",
        products: [
            { id: 1, name: "Картофель 1кг", price: 300, category: "Овощи и фрукты", unit: "кг" },
            { id: 2, name: "Яблоки 1кг", price: 400, category: "Овощи и фрукты", unit: "кг" },
            { id: 3, name: "Бананы 1кг", price: 550, category: "Овощи и фрукты", unit: "кг" },
            { id: 4, name: "Говядина 1кг", price: 3200, category: "Мясо и рыба", unit: "кг" },
            { id: 5, name: "Курица 1кг", price: 1800, category: "Мясо и рыба", unit: "кг" },
            { id: 6, name: "Молоко 1л", price: 450, category: "Молочные продукты", unit: "л" },
            { id: 7, name: "Хлеб", price: 250, category: "Хлебобулочные", unit: "шт" },
            { id: 8, name: "Яйца 10шт", price: 600, category: "Яйца", unit: "уп" }
        ]
    },
    mush: {
        name: "Мүշ",
        logo: "🏪",
        color: "#e74c3c",
        products: [
            { id: 9, name: "Картофель 1кг", price: 280, category: "Овощи и фрукты", unit: "кг" },
            { id: 10, name: "Помидоры 1кг", price: 500, category: "Овощи и фрукты", unit: "кг" },
            { id: 11, name: "Курица 1кг", price: 1750, category: "Мясо и рыба", unit: "кг" },
            { id: 12, name: "Сыр 500г", price: 1200, category: "Молочные продукты", unit: "г" },
            { id: 13, name: "Масло 500г", price: 800, category: "Молочные продукты", unit: "г" }
        ]
    },
    norak: {
        name: "Նորակ",
        logo: "🏬",
        color: "#9b59b6",
        products: [
            { id: 14, name: "Рис 1кг", price: 450, category: "Крупы", unit: "кг" },
            { id: 15, name: "Макароны 500г", price: 350, category: "Крупы", unit: "г" },
            { id: 16, name: "Сахар 1кг", price: 400, category: "Бакалея", unit: "кг" },
            { id: 17, name: "Соль 1кг", price: 150, category: "Бакалея", unit: "кг" },
            { id: 18, name: "Масло подсолнечное 1л", price: 1200, category: "Бакалея", unit: "л" }
        ]
    }
};

// Цены доставки по районам
const deliveryPrices = {
    "Артик": 500,
    "Арич": 700,
    "Нор-Кянк": 1000,
    "Пемзашен": 1000
};

// Глобальные переменные
let currentStore = null;
let currentCategory = null;
let shoppingCart = null;
let appState = {};
let nextOrderId = 1;
let nextCourierId = 1;
let currentCourier = null;
let chatUnread = 0;
let userRating = 0;

// ========== КЛАССЫ ==========
class ShoppingCart {
    constructor() {
        this.items = {};
        this.load();
    }
    
    addItem(storeId, productId, productName, price) {
        const key = `${storeId}_${productId}`;
        
        if (!this.items[key]) {
            this.items[key] = {
                storeId: storeId,
                productId: productId,
                name: productName,
                price: price,
                quantity: 0,
                storeName: stores[storeId]?.name || 'Неизвестный магазин'
            };
        }
        
        this.items[key].quantity++;
        this.save();
        this.updateDisplay();
        Notification.show(`"${productName}" добавлен в корзину!`, 'success');
        
        // Обновить кнопку корзины
        document.getElementById('cart-count').textContent = this.getTotalItems();
    }
    
    removeItem(key) {
        if (this.items[key]) {
            this.items[key].quantity--;
            
            if (this.items[key].quantity <= 0) {
                delete this.items[key];
            }
            
            this.save();
            this.updateDisplay();
            Notification.show('Товар удален из корзины', 'info');
            
            // Обновить кнопку корзины
            document.getElementById('cart-count').textContent = this.getTotalItems();
        }
    }
    
    getItem(key) {
        return this.items[key];
    }
    
    getTotalItems() {
        return Object.values(this.items).reduce((total, item) => total + item.quantity, 0);
    }
    
    getSubtotal() {
        return Object.values(this.items).reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getDeliveryPrice() {
        const district = document.getElementById('district')?.value;
        return deliveryPrices[district] || 0;
    }
    
    getTotal() {
        return this.getSubtotal() + this.getDeliveryPrice();
    }
    
    clear() {
        this.items = {};
        this.save();
        this.updateDisplay();
        document.getElementById('cart-count').textContent = '0';
    }
    
    save() {
        localStorage.setItem('artikFoodCart', JSON.stringify(this.items));
    }
    
    load() {
        const saved = localStorage.getItem('artikFoodCart');
        if (saved) {
            this.items = JSON.parse(saved);
            this.updateDisplay();
            document.getElementById('cart-count').textContent = this.getTotalItems();
        }
    }
    
    updateDisplay() {
        const itemsContainer = document.getElementById('cart-items');
        const subtotalEl = document.getElementById('cart-subtotal');
        const deliveryEl = document.getElementById('cart-delivery');
        const totalEl = document.getElementById('cart-total');
        
        if (!itemsContainer) return;
        
        itemsContainer.innerHTML = '';
        
        if (Object.keys(this.items).length === 0) {
            itemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Корзина пуста</p>
                </div>
            `;
        } else {
            Object.entries(this.items).forEach(([key, item]) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-store">${item.storeName}</div>
                    </div>
                    <div class="item-controls">
                        <div class="item-price">${item.price * item.quantity} AMD</div>
                        <div class="item-qty">
                            <button onclick="shoppingCart.removeItem('${key}')">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="shoppingCart.addItem('${item.storeId}', ${item.productId}, '${item.name}', ${item.price})">+</button>
                        </div>
                    </div>
                `;
                itemsContainer.appendChild(itemEl);
            });
        }
        
        // Обновить суммы
        if (subtotalEl) subtotalEl.textContent = this.getSubtotal();
        if (deliveryEl) deliveryEl.textContent = this.getDeliveryPrice();
        if (totalEl) totalEl.textContent = this.getTotal();
        
        // Обновить итог в форме заказа
        this.updateOrderSummary();
    }
    
    updateOrderSummary() {
        const itemsEl = document.getElementById('summary-items');
        const deliveryEl = document.getElementById('summary-delivery');
        const totalEl = document.getElementById('summary-total');
        
        if (itemsEl) itemsEl.textContent = `${this.getSubtotal()} AMD`;
        if (deliveryEl) deliveryEl.textContent = `${this.getDeliveryPrice()} AMD`;
        if (totalEl) totalEl.textContent = `${this.getTotal()} AMD`;
    }
}

class Notification {
    static show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Push-уведомление
        if (Notification.permission === 'granted') {
            new Notification('Artik Food', {
                body: message,
                icon: '/icon-192.png'
            });
        }
    }
    
    static getIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация корзины
    shoppingCart = new ShoppingCart();
    
    // Загрузка состояния приложения
    loadAppState();
    
    // Проверка онлайн-статуса
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Загрузка магазинов
    renderShops();
    
    // Инициализация поиска
    initSearch();
    
    // Загрузка отзывов
    loadReviews();
    
    // Проверка авторизации курьера
    checkCourierAuth();
    
    // Запрос на уведомления
    setTimeout(() => requestNotificationPermission(), 5000);
    
    // Загрузка сообщений чата
    loadChatMessages();
    
    // Инициализация звёзд рейтинга
    initRatingStars();
});

// ========== ФУНКЦИИ ОТОБРАЖЕНИЯ ==========
function renderShops() {
    const container = document.getElementById('shops-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(stores).forEach(([id, store]) => {
        const shopCard = document.createElement('div');
        shopCard.className = 'shop-card';
        shopCard.style.borderTop = `4px solid ${store.color}`;
        shopCard.innerHTML = `
            <div class="shop-logo" style="background: ${store.color}20">
                <span style="font-size: 40px;">${store.logo}</span>
            </div>
            <div class="content">
                <h4>${store.name}</h4>
                <p>${store.products.length} товаров</p>
                <button class="btn-shop" onclick="openStore('${id}')">
                    <i class="fas fa-shopping-basket"></i> Выбрать товары
                </button>
            </div>
        `;
        container.appendChild(shopCard);
    });
}

function openStore(storeId) {
    const store = stores[storeId];
    if (!store) return;
    
    currentStore = storeId;
    
    // Скрыть главную, показать продукты
    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('store-products').classList.remove('hidden');
    
    // Обновить заголовок
    document.getElementById('store-title').textContent = store.name;
    
    // Группировать продукты по категориям
    const categories = {};
    store.products.forEach(product => {
        if (!categories[product.category]) {
            categories[product.category] = [];
        }
        categories[product.category].push(product);
    });
    
    // Отрендерить продукты
    const container = document.getElementById('products-list');
    container.innerHTML = '';
    
    Object.entries(categories).forEach(([category, products]) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `<h4>${category}</h4>`;
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="content">
                    <h4>${product.name}</h4>
                    <p class="price">${product.price} AMD/${product.unit}</p>
                    <div class="qty-controls">
                        <button onclick="removeProductFromCart('${storeId}', ${product.id})">-</button>
                        <span class="qty-number">${getProductQuantity(storeId, product.id)}</span>
                        <button onclick="addProductToCart('${storeId}', ${product.id}, '${product.name}', ${product.price})">+</button>
                    </div>
                </div>
            `;
            categorySection.appendChild(productCard);
        });
        
        container.appendChild(categorySection);
    });
}

function addProductToCart(storeId, productId, productName, price) {
    shoppingCart.addItem(storeId, productId, productName, price);
}

function removeProductFromCart(storeId, productId) {
    const key = `${storeId}_${productId}`;
    shoppingCart.removeItem(key);
}

function getProductQuantity(storeId, productId) {
    const key = `${storeId}_${productId}`;
    const item = shoppingCart.getItem(key);
    return item ? item.quantity : 0;
}

// ========== ПОИСК ==========
function initSearch() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            // Вернуться к магазинам
            document.getElementById('store-products').classList.add('hidden');
            document.getElementById('home-page').classList.remove('hidden');
            return;
        }
        
        // Поиск по всем магазинам
        const results = [];
        
        Object.entries(stores).forEach(([storeId, store]) => {
            store.products.forEach(product => {
                if (product.name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        storeId: storeId,
                        store: store,
                        product: product
                    });
                }
            });
        });
        
        // Показать результаты
        showSearchResults(results, searchTerm);
    });
}

function showSearchResults(results, searchTerm) {
    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('store-products').classList.remove('hidden');
    
    document.getElementById('store-title').textContent = `Результаты поиска: "${searchTerm}"`;
    
    const container = document.getElementById('products-list');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h4>Товары не найдены</h4>
                <p>Попробуйте другой запрос</p>
            </div>
        `;
        return;
    }
    
    // Группировать по магазинам
    const storesGrouped = {};
    
    results.forEach(result => {
        if (!storesGrouped[result.storeId]) {
            storesGrouped[result.storeId] = {
                store: result.store,
                products: []
            };
        }
        storesGrouped[result.storeId].products.push(result.product);
    });
    
    Object.entries(storesGrouped).forEach(([storeId, data]) => {
        const storeSection = document.createElement('div');
        storeSection.className = 'store-section';
        storeSection.innerHTML = `
            <h5 style="color: ${data.store.color}; margin-bottom: 15px;">
                ${data.store.logo} ${data.store.name}
            </h5>
        `;
        
        data.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="content">
                    <h4>${product.name}</h4>
                    <p class="price">${product.price} AMD/${product.unit}</p>
                    <div class="qty-controls">
                        <button onclick="removeProductFromCart('${storeId}', ${product.id})">-</button>
                        <span class="qty-number">${getProductQuantity(storeId, product.id)}</span>
                        <button onclick="addProductToCart('${storeId}', ${product.id}, '${product.name}', ${product.price})">+</button>
                    </div>
                </div>
            `;
            storeSection.appendChild(productCard);
        });
        
        container.appendChild(storeSection);
    });
}

function clearSearch() {
    document.getElementById('product-search').value = '';
    goHome();
}

// ========== КОРЗИНА ==========
function toggleCart() {
    const cart = document.getElementById('cart-sidebar');
    cart.classList.toggle('open');
    
    // Обновить корзину при открытии
    if (cart.classList.contains('open')) {
        shoppingCart.updateDisplay();
    }
}

function scrollToOrder() {
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
    toggleCart(); // Закрыть кор
