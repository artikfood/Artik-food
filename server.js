const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Путь к данным
const DATA_FILE = 'data.json';
const ORDERS_FILE = 'orders.json';
const COURIERS_FILE = 'couriers.json';

// Инициализация файлов если их нет
async function initializeFiles() {
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, JSON.stringify([]));
  }
  
  try {
    await fs.access(COURIERS_FILE);
  } catch {
    await fs.writeFile(COURIERS_FILE, JSON.stringify([]));
  }
}

// API endpoints

// Получить данные магазинов
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки данных' });
  }
});

// Создать заказ
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    order.id = Date.now();
    order.createdAt = new Date().toISOString();
    order.status = 'new';
    
    const ordersData = await fs.readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(ordersData);
    orders.push(order);
    
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    
    // Здесь можно добавить логику отправки в WhatsApp
    // sendToWhatsApp(order);
    
    res.json({ success: true, orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// Получить заказы (для админа/курьера)
app.get('/api/orders', async (req, res) => {
  try {
    const { status, courierId } = req.query;
    const ordersData = await fs.readFile(ORDERS_FILE, 'utf8');
    let orders = JSON.parse(ordersData);
    
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    if (courierId) {
      orders = orders.filter(order => order.courierId == courierId);
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки заказов' });
  }
});

// Обновить статус заказа
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, courierId } = req.body;
    
    const ordersData = await fs.readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(ordersData);
    
    const orderIndex = orders.findIndex(order => order.id == id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    orders[orderIndex].status = status;
    if (courierId) {
      orders[orderIndex].courierId = courierId;
      orders[orderIndex].assignedAt = new Date().toISOString();
    }
    
    if (status === 'delivered') {
      orders[orderIndex].deliveredAt = new Date().toISOString();
    }
    
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления заказа' });
  }
});

// Курьер API
app.post('/api/couriers/register', async (req, res) => {
  try {
    const courier = req.body;
    courier.id = Date.now();
    courier.status = 'pending';
    courier.registrationDate = new Date().toISOString();
    courier.ordersCompleted = 0;
    courier.rating = 0;
    
    const couriersData = await fs.readFile(COURIERS_FILE, 'utf8');
    const couriers = JSON.parse(couriersData);
    
    // Проверка существующего курьера
    const existing = couriers.find(c => c.phone === courier.phone);
    if (existing) {
      return res.status(400).json({ error: 'Курьер уже зарегистрирован' });
    }
    
    couriers.push(courier);
    await fs.writeFile(COURIERS_FILE, JSON.stringify(couriers, null, 2));
    
    res.json({ success: true, courierId: courier.id });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка регистрации курьера' });
  }
});

app.post('/api/couriers/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const couriersData = await fs.readFile(COURIERS_FILE, 'utf8');
    const couriers = JSON.parse(couriersData);
    
    const courier = couriers.find(c => c.phone === phone && c.password === password);
    if (!courier) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Убираем пароль из ответа
    const { password: _, ...safeCourier } = courier;
    res.json(safeCourier);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Отзывы
app.post('/api/reviews', async (req, res) => {
  try {
    const review = req.body;
    review.id = Date.now();
    review.createdAt = new Date().toISOString();
    
    // Чтение и запись отзывов
    const reviewsFile = 'reviews.json';
    let reviews = [];
    
    try {
      const reviewsData = await fs.readFile(reviewsFile, 'utf8');
      reviews = JSON.parse(reviewsData);
    } catch {
      // Файл не существует
    }
    
    reviews.push(review);
    await fs.writeFile(reviewsFile, JSON.stringify(reviews, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сохранения отзыва' });
  }
});

// Push подписка
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    
    // Сохраняем подписку
    const subscriptionsFile = 'push-subscriptions.json';
    let subscriptions = [];
    
    try {
      const subsData = await fs.readFile(subscriptionsFile, 'utf8');
      subscriptions = JSON.parse(subsData);
    } catch {
      // Файл не существует
    }
    
    // Проверяем дубликат
    const exists = subscriptions.some(sub => 
      sub.endpoint === subscription.endpoint
    );
    
    if (!exists) {
      subscriptions.push(subscription);
      await fs.writeFile(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка подписки' });
  }
});

// VAPID ключи для push (нужно сгенерировать)
app.get('/api/push/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  res.json({ publicKey });
});

// Статика для всех маршрутов (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Инициализация и запуск
initializeFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Приложение доступно по адресу: http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Ошибка инициализации:', error);
});
