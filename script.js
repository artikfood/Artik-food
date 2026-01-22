// Пример данных для супермаркетов
const stores = {
    1: {
        name: "Супермаркет 1",
        categories: [
            {
                name: "Овощи",
                products: [
                    { name: "Картофель", price: "50 руб/кг" },
                    { name: "Морковь", price: "40 руб/кг" }
                ]
            },
            {
                name: "Молочные продукты",
                products: [
                    { name: "Молоко", price: "80 руб/л" },
                    { name: "Сыр", price: "200 руб/кг" }
                ]
            }
        ]
    },
    2: {
        name: "Супермаркет 2",
        categories: [
            {
                name: "Фрукты",
                products: [
                    { name: "Яблоки", price: "70 руб/кг" },
                    { name: "Бананы", price: "90 руб/кг" }
                ]
            }
        ]
    }
    // Добавьте данные для магазинов 3 и 4
};

// Открывает страницу супермаркета
function openStore(id) {
    const store = stores[id];
    if (!store) return alert("Магазин не найден!");

    let categoriesHTML = store.categories.map(category => `
        <div class="category">
            <h3>${category.name}</h3>
            <div class="product-list">
                ${category.products.map(product => `
                    <div class="product-card">
                        <p>${product.name} — ${product.price}</p>
                        <button onclick="addToCart('${product.name}')">Добавить</button>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");

    document.body.innerHTML = `
        <header>
            <div class="logo">Artik Food</div>
            <nav>
                <a href="#" onclick="location.reload()">Назад</a>
                <a href="#cart">Корзина</a>
            </nav>
        </header>
        <section id="store">
            <h1>${store.name}</h1>
            ${categoriesHTML}
        </section>
        <footer>
            <p>&copy; 2023 Artik Food Delivery</p>
        </footer>
    `;
}

// Добавляет товар в корзину
function addToCart(productName) {
    alert(`Товар "${productName}" добавлен в корзину!`);
}
