// Event producer: backend ke important kaam Kafka mein bhejta hai (data engineering pipeline ka source).
// - EVENTS_ENABLED=true ho tabhi chalta hai; warna emit() kuch nahi karta, app pehle jaisi chalti hai.
// - Fire-and-forget: Kafka band ho ya error aaye to API request kabhi fail nahi hoti.
// Schema aur topics: docs/EVENTS.md
const crypto = require('crypto');

const SCHEMA_VERSION = 1;

const TOPICS = {
  clicks: 'bazaaro.clicks',
  cart: 'bazaaro.cart',
  orders: 'bazaaro.orders',
  payments: 'bazaaro.payments',
  inventory: 'bazaaro.inventory',
  delivery: 'bazaaro.delivery',
};

const enabled = () => String(process.env.EVENTS_ENABLED).toLowerCase() === 'true';

let producer = null;
let connecting = null;
let lastWarn = 0;

function warn(msg) {
  // Har event par console na bhare: 30 second mein ek baar
  if (Date.now() - lastWarn > 30000) {
    lastWarn = Date.now();
    console.warn(`[events] ${msg}`);
  }
}

async function getProducer() {
  if (producer) return producer;
  if (!connecting) {
    connecting = (async () => {
      const { Kafka, logLevel } = require('kafkajs');
      const kafka = new Kafka({
        clientId: 'bazaaro-api',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(','),
        logLevel: logLevel.NOTHING,
        retry: { retries: 2, initialRetryTime: 300 },
      });
      const p = kafka.producer({ allowAutoTopicCreation: true });
      p.on(p.events.DISCONNECT, () => { producer = null; connecting = null; });
      await p.connect();
      producer = p;
      return p;
    })().catch((err) => {
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

// Test mein hook: asli Kafka ki jagah koi aur producer
function _setProducer(p) { producer = p; }

// topic: TOPICS.xxx, type: "order.created", data: payload, key: partition key (order id / user id)
function emit(topic, type, data, { key, userId } = {}) {
  if (!enabled()) return;
  const event = {
    event_id: crypto.randomUUID(),
    event_type: type,
    schema_version: SCHEMA_VERSION,
    occurred_at: new Date().toISOString(),
    source: 'api',
    user_id: userId ? String(userId) : null,
    data,
  };
  getProducer()
    .then((p) => p.send({
      topic,
      messages: [{ key: key ? String(key) : event.event_id, value: JSON.stringify(event) }],
    }))
    .catch((err) => warn(`send failed (${type}): ${err.message}`));
}

async function shutdown() {
  if (producer) await producer.disconnect().catch(() => {});
}

// ── Chhote helpers: controller mein ek line mein emit ──
const lineData = (l) => ({
  product_id: String(l.productId || l.product),
  color: l.color ?? null,
  size: l.size ?? null,
  quantity: l.quantity,
});

function orderData(order) {
  return {
    order_id: String(order._id),
    status: order.orderStatus,
    payment_method: order.PaymentMethod,
    payment_status: order.PaymentStatus,
    items_price: order.itemsPrice,
    shipping_price: order.shippingPrice,
    total_price: order.totalPrice,
    city: order.shippingAddress?.city ?? null,
    items: (order.orderItems || []).map((i) => ({
      product_id: String(i.product),
      name: i.name,
      color: i.color ?? null,
      size: i.size ?? null,
      quantity: i.quantity,
      price: i.price,
    })),
  };
}

module.exports = { emit, shutdown, enabled, TOPICS, SCHEMA_VERSION, lineData, orderData, _setProducer };
