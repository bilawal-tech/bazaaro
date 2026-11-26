const Order = require('../models/Order');
const { releaseStock, linesFromOrderItems } = require('../utils/variants');
const { emit, TOPICS, orderData } = require('../utils/events');
const { isStripeConfigured, getStripe, toStripeAmount } = require('../utils/stripe');

const UNPAID_MINUTES = Number(process.env.UNPAID_ORDER_MINUTES) || 30;

// ── Payment Intent banao (ya purana wapas do) ─
// Order pehle POST /api/orders se banta hai (PaymentMethod: 'Credit Card').
// Amount hamesha server ke order.totalPrice se aata hai, client par bharosa nahi.
async function createPaymentIntent(req, res) {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ success: false, message: 'Card payments are not available right now' });
    }

    const order = await Order.findById(req.body.orderId);
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.PaymentMethod !== 'Credit Card') {
      return res.status(400).json({ success: false, message: 'This order is not a card order' });
    }
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({ success: false, message: `Order is ${order.orderStatus}` });
    }
    if (order.PaymentStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    const stripe = getStripe();

    // Retry par wahi intent dobara use karo (duplicate charges nahi banenge)
    if (order.paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (existing.status !== 'canceled') {
        return res.status(200).json({ success: true, clientSecret: existing.client_secret, orderId: order._id });
      }
    }

    const { amount, currency } = toStripeAmount(order.totalPrice);
    const intent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
      },
      { idempotencyKey: `order-${order._id}-${order.paymentIntentId || 'first'}` }
    );

    order.paymentIntentId = intent.id;
    await order.save();

    return res.status(200).json({ success: true, clientSecret: intent.client_secret, orderId: order._id });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── Stripe Webhook ────────────────────────────
// Raw body chahiye (server.js mein express.json se pehle lagta hai).
async function handleWebhook(req, res) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook not configured');
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature failed: ${err.message}`);
  }

  try {
    const intent = event.data.object;

    if (event.type === 'payment_intent.succeeded') {
      const order = await Order.findOne({ paymentIntentId: intent.id });
      if (order) {
        if (order.orderStatus === 'cancelled') {
          // Paise aa gaye lekin order pehle hi cancel (e.g. 30 min guzar gaye): wapas karo
          await getStripe().refunds.create({ payment_intent: intent.id });
          order.PaymentStatus = 'Refunded';
          await order.save();
          emit(TOPICS.payments, 'payment.refunded', { order_id: String(order._id), amount: order.totalPrice, reason: 'order_already_cancelled' }, { key: order._id, userId: order.user });
        } else if (order.PaymentStatus !== 'Completed') {
          order.PaymentStatus = 'Completed';
          order.paidAt = new Date();
          await order.save();
          emit(TOPICS.payments, 'payment.succeeded', { order_id: String(order._id), amount: order.totalPrice, method: 'card' }, { key: order._id, userId: order.user });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      // Sirf Pending/Failed orders: customer wahi intent par dobara try kar sakta hai
      const failed = await Order.findOneAndUpdate(
        { paymentIntentId: intent.id, PaymentStatus: { $in: ['Pending', 'Failed'] } },
        { PaymentStatus: 'Failed', paymentFailedAt: new Date() },
        { new: true }
      );
      if (failed) emit(TOPICS.payments, 'payment.failed', { order_id: String(failed._id), amount: failed.totalPrice, method: 'card' }, { key: failed._id, userId: failed.user });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    // 500 par Stripe dobara bhejta hai
    console.error('Webhook handler error:', error);
    return res.status(500).send('Webhook handler error');
  }
}

// ── Order cancel hone par payment ka kaam ─────
// Paid hai to refund, unpaid hai to intent cancel. Cancel flow isay save se pehle bulata hai.
async function settlePaymentOnCancel(order) {
  if (order.PaymentMethod !== 'Credit Card' || !order.paymentIntentId || !isStripeConfigured()) return;
  const stripe = getStripe();

  if (order.PaymentStatus === 'Completed') {
    await stripe.refunds.create({ payment_intent: order.paymentIntentId });
    order.PaymentStatus = 'Refunded';
  } else {
    try {
      await stripe.paymentIntents.cancel(order.paymentIntentId);
    } catch (err) {
      // Intent pehle hi succeeded/cancelled ho sakta hai; webhook baqi sambhal lega
      console.warn('Could not cancel payment intent:', err.message);
    }
  }
}

// ── Be-adaa card orders ka sweeper ────────────
// Customer card page chhor jaye to stock hamesha ke liye ruka na rahe.
async function cancelUnpaidCardOrders() {
  const cutoff = new Date(Date.now() - UNPAID_MINUTES * 60 * 1000);
  const stale = await Order.find({
    PaymentMethod: 'Credit Card',
    PaymentStatus: { $in: ['Pending', 'Failed'] },
    orderStatus: 'processing',
    createdAt: { $lt: cutoff },
  }).limit(50);

  for (const candidate of stale) {
    // Atomic claim: sirf ek process/webhook jeet sakta hai
    const order = await Order.findOneAndUpdate(
      { _id: candidate._id, orderStatus: 'processing', PaymentStatus: { $in: ['Pending', 'Failed'] } },
      { orderStatus: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    if (!order) continue;

    await releaseStock(linesFromOrderItems(order.orderItems));
    await settlePaymentOnCancel(order);
    if (order.isModified()) await order.save();
    emit(TOPICS.orders, 'order.status_changed', { ...orderData(order), previous_status: 'processing', changed_by: 'system_unpaid_timeout' }, { key: order._id, userId: order.user });
  }
}

function startUnpaidOrderSweeper() {
  const timer = setInterval(() => {
    cancelUnpaidCardOrders().catch((err) => console.error('Unpaid order sweeper error:', err.message));
  }, 5 * 60 * 1000);
  timer.unref();
}

module.exports = {
  createPaymentIntent,
  handleWebhook,
  settlePaymentOnCancel,
  startUnpaidOrderSweeper,
};
