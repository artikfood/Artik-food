function sendFormToWhatsApp() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const district = document.getElementById('district').value;
  const payment = document.getElementById('payment').value;
  const comment = document.getElementById('comment').value;

  let message = `🛒 *Новый заказ — Artik Food*%0A%0A`;
  message += `👤 Имя: ${name}%0A`;
  message += `📞 Телефон: ${phone}%0A`;
  message += `📍 Адрес: ${address}%0A`;
  message += `🏘 Район: ${district}%0A`;
  message += `💳 Оплата: ${payment}%0A`;
  if (comment) message += `📝 Комментарий: ${comment}%0A`;
  message += `%0A📦 *Товары:*%0A`;

  let total = 0;

  Object.keys(carts).forEach(storeKey => {
    Object.keys(carts[storeKey]).forEach(productName => {
      const qty = carts[storeKey][productName];
      if (qty > 0) {
        const product = stores[storeKey].products.find(p => p.name === productName);
        const price = product.price * qty;
        total += price;
        message += `- ${productName} (${stores[storeKey].name}) × ${qty} = ${price} AMD%0A`;
      }
    });
  });

  let delivery = 0;
  if (district === "Артик") delivery = 500;
  else if (district === "Арич") delivery = 700;
  else if (district === "Нор-Кянк") delivery = 1000;
  else if (district === "Пемзашен") delivery = 1000;

  message += `%0A🚚 Доставка: ${delivery} AMD%0A`;
  message += `💰 *Итого: ${total + delivery} AMD*`;

  // ✅✅✅ ВОТ СЮДА ВСТАВЛЯЕМ ОТПРАВКУ НА WORKER (до window.open)
  const WORKER_URL = "https://YOUR_WORKER_SUBDOMAIN.workers.dev/orders";
  const API_KEY = "PUT_YOUR_API_KEY_HERE";

  fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({
      name, phone, address, district, payment, comment,
      carts,
      storesCatalog: stores
    })
  }).catch(() => {});
  // ✅✅✅ КОНЕЦ ВСТАВКИ

  const whatsappNumber = "37443797727";
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(url, "_blank");
}
