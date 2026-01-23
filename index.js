// Cloudflare Worker — Artik Food dispatcher (Telegram + Orders)
// Requirements: KV namespace binding: ORDERS_KV
// Env vars (Workers → Settings → Variables):
// BOT_TOKEN, API_KEY, ADMIN_CHAT_ID, COURIERS_CHAT_ID, STORE_CHAT_MAP_JSON, PUBLIC_BASE_URL (optional)

function json(res, status = 200) {
  return new Response(JSON.stringify(res, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function text(res, status = 200) {
  return new Response(res, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function requireApiKey(req, env) {
  const key = req.headers.get("x-api-key") || "";
  return key && env.API_KEY && key === env.API_KEY;
}

function nowIso() {
  return new Date().toISOString();
}

function safeParseJson(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function makeOrderId() {
  // simple unique id
  return "ord_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function formatAmd(n) {
  return `${Number(n || 0)} AMD`;
}

function computeDelivery(district) {
  if (district === "Артик") return 500;
  if (district === "Арич") return 700;
  if (district === "Нор-Кянк") return 1000;
  if (district === "Пемзашен") return 1000;
  return 0;
}

function extractStoresFromCarts(carts) {
  const storeKeys = [];
  if (!carts || typeof carts !== "object") return storeKeys;

  for (const storeKey of Object.keys(carts)) {
    const bag = carts[storeKey];
    if (!bag || typeof bag !== "object") continue;
    const hasItems = Object.values(bag).some(qty => Number(qty) > 0);
    if (hasItems) storeKeys.push(storeKey);
  }
  return storeKeys;
}

function buildItemsByStore(storesCatalog, carts) {
  // storesCatalog can be omitted; we rely on client sending items too (recommended),
  // but we support "carts only" as well.
  const result = {};
  if (!carts || typeof carts !== "object") return result;

  for (const storeKey of Object.keys(carts)) {
    const bag = carts[storeKey];
    if (!bag || typeof bag !== "object") continue;
    const items = [];
    for (const productName of Object.keys(bag)) {
      const qty = Number(bag[productName] || 0);
      if (qty <= 0) continue;

      // If client also sends price map, we can include it. Otherwise "?"
      let price = null;
      if (storesCatalog && storesCatalog[storeKey] && Array.isArray(storesCatalog[storeKey].products)) {
        const p = storesCatalog[storeKey].products.find(x => x.name === productName);
        if (p && typeof p.price === "number") price = p.price;
      }

      items.push({ name: productName, qty, price });
    }
    if (items.length) result[storeKey] = items;
  }
  return result;
}

function sumItems(itemsByStore) {
  let total = 0;
  for (const storeKey of Object.keys(itemsByStore)) {
    for (const it of itemsByStore[storeKey]) {
      if (typeof it.price === "number") total += it.price * it.qty;
    }
  }
  return total;
}

function storeKeyToHuman(storeKey, storeNameMap) {
  return (storeNameMap && storeNameMap[storeKey]) ? storeNameMap[storeKey] : storeKey;
}

async function tgCall(env, method, payload) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) {
    // Don't crash, but return details for logs
    return { ok: false, status: r.status, data };
  }
  return { ok: true, data };
}

function buildAdminText(order, storeNameMap) {
  const stores = order.storeKeys.map(k => `• ${storeKeyToHuman(k, storeNameMap)} (${k})`).join("\n");
  const lines = [];
  lines.push(`🛒 Новый заказ *Artik Food*`);
  lines.push(`🆔 ${order.id}`);
  lines.push(`🕒 ${order.createdAtIso}`);
  lines.push(``);
  lines.push(`👤 Имя: ${order.customer.name}`);
  lines.push(`📞 Телефон: ${order.customer.phone}`);
  lines.push(`📍 Адрес: ${order.customer.address}`);
  lines.push(`🏘 Район: ${order.customer.district || "-"}`);
  lines.push(`💳 Оплата: ${order.customer.payment || "-"}`);
  if (order.customer.comment) lines.push(`📝 Комментарий: ${order.customer.comment}`);
  lines.push(``);
  lines.push(`🏪 Магазины:\n${stores || "-"}`);
  lines.push(``);
  lines.push(`📦 Товары:`);
  for (const sk of Object.keys(order.itemsByStore)) {
    lines.push(`\n*${storeKeyToHuman(sk, storeNameMap)}*`);
    for (const it of order.itemsByStore[sk]) {
      const pricePart = (typeof it.price === "number") ? ` — ${formatAmd(it.price)} / шт` : "";
      lines.push(`- ${it.name} × ${it.qty}${pricePart}`);
    }
  }
  lines.push(``);
  lines.push(`🧾 Товары: ${formatAmd(order.itemsTotal)}`);
  lines.push(`🚚 Доставка: ${formatAmd(order.delivery)}`);
  lines.push(`💰 *Итого: ${formatAmd(order.grandTotal)}*`);
  lines.push(``);
  lines.push(`📌 Статус: *${order.status}*`);

  return lines.join("\n");
}

function buildCouriersText(order, storeNameMap) {
  const storeList = order.storeKeys.map(k => storeKeyToHuman(k, storeNameMap)).join(" + ");
  const lines = [];
  lines.push(`🚴 Новый заказ для курьеров`);
  lines.push(`🆔 ${order.id}`);
  lines.push(`🏘 ${order.customer.district || "-"} • ${order.customer.address}`);
  lines.push(`📞 ${order.customer.phone}`);
  lines.push(`🏪 ${storeList || "-"}`);
  lines.push(`💰 ${formatAmd(order.grandTotal)} (вкл. доставку)`);
  lines.push(`📌 Статус: *${order.status}*`);
  return lines.join("\n");
}

function buildStoreText(order, storeKey, storeNameMap) {
  const items = order.itemsByStore[storeKey] || [];
  const lines = [];
  lines.push(`🏪 Заказ для магазина: *${storeKeyToHuman(storeKey, storeNameMap)}*`);
  lines.push(`🆔 ${order.id}`);
  lines.push(`🕒 ${order.createdAtIso}`);
  lines.push(`📍 Доставка: ${order.customer.district || "-"}, ${order.customer.address}`);
  lines.push(``);
  lines.push(`📦 Список:`);
  for (const it of items) {
    const pricePart = (typeof it.price === "number") ? ` (${formatAmd(it.price)} / шт)` : "";
    lines.push(`- ${it.name} × ${it.qty}${pricePart}`);
  }
  lines.push(``);
  lines.push(`📌 Статус заказа: *${order.status}*`);
  lines.push(`✅ Для магазина: нажмите “Собрано”, когда всё готово.`);
  return lines.join("\n");
}

function kbForCouriers(orderId) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Принял", callback_data: `o:${orderId}:courier_accept` },
        { text: "🚚 В пути", callback_data: `o:${orderId}:courier_onway` },
      ],
      [
        { text: "📦 Доставлено", callback_data: `o:${orderId}:courier_done` },
      ],
    ],
  };
}

function kbForStore(orderId, storeKey) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Собрано", callback_data: `o:${orderId}:store_packed:${storeKey}` },
      ],
    ],
  };
}

function kbForAdmin(orderId) {
  return {
    inline_keyboard: [
      [
        { text: "🔄 Обновить статус", callback_data: `o:${orderId}:admin_refresh` },
      ],
    ],
  };
}

async function saveOrder(env, order) {
  await env.ORDERS_KV.put(`order:${order.id}`, JSON.stringify(order));
  // simple index list
  const idxRaw = await env.ORDERS_KV.get("order:index");
  const idx = safeParseJson(idxRaw || "[]", []);
  idx.unshift({ id: order.id, createdAt: order.createdAt, status: order.status });
  // keep last 200
  await env.ORDERS_KV.put("order:index", JSON.stringify(idx.slice(0, 200)));
}

async function loadOrder(env, id) {
  const raw = await env.ORDERS_KV.get(`order:${id}`);
  if (!raw) return null;
  return safeParseJson(raw, null);
}

async function updateOrder(env, id, patchFn) {
  const order = await loadOrder(env, id);
  if (!order) return null;
  const updated = patchFn(order) || order;
  await env.ORDERS_KV.put(`order:${id}`, JSON.stringify(updated));

  // update index entry status (best effort)
  const idxRaw = await env.ORDERS_KV.get("order:index");
  const idx = safeParseJson(idxRaw || "[]", []);
  for (const row of idx) {
    if (row.id === id) row.status = updated.status;
  }
  await env.ORDERS_KV.put("order:index", JSON.stringify(idx));
  return updated;
}

async function notifyAll(env, order, storeChatMap, storeNameMap) {
  // Admin
  await tgCall(env, "sendMessage", {
    chat_id: env.ADMIN_CHAT_ID,
    text: buildAdminText(order, storeNameMap),
    parse_mode: "Markdown",
    reply_markup: kbForAdmin(order.id),
    disable_web_page_preview: true,
  });

  // Couriers
  await tgCall(env, "sendMessage", {
    chat_id: env.COURIERS_CHAT_ID,
    text: buildCouriersText(order, storeNameMap),
    parse_mode: "Markdown",
    reply_markup: kbForCouriers(order.id),
    disable_web_page_preview: true,
  });

  // Stores (only those in order)
  for (const storeKey of order.storeKeys) {
    const chatId = storeChatMap[storeKey];
    if (!chatId) continue;

    await tgCall(env, "sendMessage", {
      chat_id: chatId,
      text: buildStoreText(order, storeKey, storeNameMap),
      parse_mode: "Markdown",
      reply_markup: kbForStore(order.id, storeKey),
      disable_web_page_preview: true,
    });
  }
}

function ensureEnv(env) {
  const missing = [];
  for (const k of ["BOT_TOKEN","API_KEY","ADMIN_CHAT_ID","COURIERS_CHAT_ID","STORE_CHAT_MAP_JSON"]) {
    if (!env[k]) missing.push(k);
  }
  return missing;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // Health
    if (url.pathname === "/") {
      const missing = ensureEnv(env);
      return text(missing.length ? `OK, but missing: ${missing.join(", ")}` : "OK");
    }

    // Telegram webhook
    if (url.pathname === "/tg/webhook" && req.method === "POST") {
      const update = await req.json().catch(() => null);
      if (!update) return json({ ok: true });

      // Handle callback queries (button clicks)
      if (update.callback_query) {
        const cq = update.callback_query;
        const data = cq.data || "";
        const parts = data.split(":"); // o:<id>:action[:storeKey]
        if (parts[0] === "o" && parts[1]) {
          const orderId = parts[1];
          const action = parts[2] || "";
          const storeKey = parts[3] || "";

          const storeChatMap = safeParseJson(env.STORE_CHAT_MAP_JSON, {});
          const storeNameMap = {}; // optional, keep keys; you can fill later if you want

          let newOrder = await updateOrder(env, orderId, (o) => {
            // statuses:
            // NEW -> COURIER_ACCEPTED -> ON_WAY -> DELIVERED
            // storePacked flags per store
            if (!o.storePacked) o.storePacked = {};
            if (!o.history) o.history = [];
            const stamp = { at: nowIso(), by: cq.from?.username || cq.from?.id || "unknown", action };

            if (action === "courier_accept") {
              o.status = "COURIER_ACCEPTED";
              o.history.push(stamp);
            } else if (action === "courier_onway") {
              o.status = "ON_WAY";
              o.history.push(stamp);
            } else if (action === "courier_done") {
              o.status = "DELIVERED";
              o.history.push(stamp);
            } else if (action === "store_packed" && storeKey) {
              o.storePacked[storeKey] = true;
              o.history.push({ ...stamp, storeKey });
              // If all stores packed and still NEW, keep NEW but note packed progress (admin will see)
            } else if (action === "admin_refresh") {
              o.history.push(stamp);
            }
            return o;
          });

          // Acknowledge button click
          await tgCall(env, "answerCallbackQuery", {
            callback_query_id: cq.id,
            text: "✅ Принято",
            show_alert: false,
          });

          // Send updated status to admin (and optionally to couriers)
          if (newOrder) {
            const packedCount = newOrder.storePacked ? Object.values(newOrder.storePacked).filter(Boolean).length : 0;
            const packedText = newOrder.storeKeys?.length ? `${packedCount}/${newOrder.storeKeys.length}` : "-";
            await tgCall(env, "sendMessage", {
              chat_id: env.ADMIN_CHAT_ID,
              text:
                `📌 Обновление заказа *${newOrder.id}*\n` +
                `Статус: *${newOrder.status}*\n` +
                `Собрано магазинами: *${packedText}*\n` +
                `Последнее действие: *${action}*`,
              parse_mode: "Markdown",
            });
          }

          return json({ ok: true });
        }
      }

      return json({ ok: true });
    }

    // Create order
    if (url.pathname === "/orders" && req.method === "POST") {
      if (!requireApiKey(req, env)) return json({ error: "Unauthorized" }, 401);

      const missing = ensureEnv(env);
      if (missing.length) return json({ error: "Missing env vars", missing }, 500);

      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "Bad JSON" }, 400);

      // Expected from client: { name, phone, address, district, payment, comment, carts, storesCatalog? }
      const customer = {
        name: String(body.name || "").trim(),
        phone: String(body.phone || "").trim(),
        address: String(body.address || "").trim(),
        district: String(body.district || "").trim(),
        payment: String(body.payment || "").trim(),
        comment: String(body.comment || "").trim(),
      };
      if (!customer.name || !customer.phone || !customer.address) {
        return json({ error: "Missing required fields: name/phone/address" }, 400);
      }

      const carts = body.carts || {};
      const storeKeys = extractStoresFromCarts(carts);
      if (!storeKeys.length) return json({ error: "Empty cart" }, 400);

      const storesCatalog = body.storesCatalog || null;
      const itemsByStore = buildItemsByStore(storesCatalog, carts);

      // totals (prices known only if client sent catalog or you extend worker later)
      const itemsTotal = sumItems(itemsByStore);
      const delivery = computeDelivery(customer.district);
      const grandTotal = itemsTotal + delivery;

      const order = {
        id: makeOrderId(),
        createdAt: Date.now(),
        createdAtIso: nowIso(),
        status: "NEW",
        customer,
        carts,              // raw
        itemsByStore,       // expanded
        storeKeys,
        itemsTotal,
        delivery,
        grandTotal,
        storePacked: {},    // storeKey -> true
        history: [{ at: nowIso(), by: "site", action: "created" }],
      };

      await saveOrder(env, order);

      const storeChatMap = safeParseJson(env.STORE_CHAT_MAP_JSON, {});
      // optional human names: keep empty; you already have names in your site, it’s ok.
      const storeNameMap = {};

      ctx.waitUntil(notifyAll(env, order, storeChatMap, storeNameMap));

      return json({ ok: true, id: order.id });
    }

    // List recent orders (for courier.html, optional)
    if (url.pathname === "/orders" && req.method === "GET") {
      if (!requireApiKey(req, env)) return json({ error: "Unauthorized" }, 401);

      const idxRaw = await env.ORDERS_KV.get("order:index");
      const idx = safeParseJson(idxRaw || "[]", []);
      return json({ ok: true, orders: idx });
    }

    // Get one order
    if (url.pathname.startsWith("/orders/") && req.method === "GET") {
      if (!requireApiKey(req, env)) return json({ error: "Unauthorized" }, 401);
      const id = url.pathname.split("/")[2] || "";
      const order = await loadOrder(env, id);
      if (!order) return json({ error: "Not found" }, 404);
      return json({ ok: true, order });
    }

    // Update status (for courier.html, optional)
    if (url.pathname.startsWith("/orders/") && url.pathname.endsWith("/status") && req.method === "POST") {
      if (!requireApiKey(req, env)) return json({ error: "Unauthorized" }, 401);
      const parts = url.pathname.split("/");
      const id = parts[2] || "";
      const body = await req.json().catch(() => null);
      if (!body || !body.status) return json({ error: "Missing status" }, 400);

      const status = String(body.status);
      const order = await updateOrder(env, id, (o) => {
        o.status = status;
        if (!o.history) o.history = [];
        o.history.push({ at: nowIso(), by: "courier_page", action: `set:${status}` });
        return o;
      });
      if (!order) return json({ error: "Not found" }, 404);

      return json({ ok: true, order });
    }

    return json({ error: "Not found" }, 404);
  },
};
