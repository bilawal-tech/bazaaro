const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const {
  resolveLine,
  reserveStock,
  releaseStock,
  linesFromOrderItems,
} = require('../utils/variants');
const { parsePagination } = require('../utils/query');
const { settlePaymentOnCancel } = require('./payment');

const STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

const PAYMENT_METHODS = Order.schema.path('PaymentMethod').enumValues;

// Shipping address: sab fields string hon, trim hon, aur sahi length/format ke hon.
// Client par bharose nahi, is liye server par bhi check.
function validateShipping(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Shipping address is required' };
  }

  const clean = {};
  for (const field of ['fullName', 'phone', 'street', 'city', 'zip']) {
    const value = input[field];
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return { error: `Invalid ${field}` };
    }
    clean[field] = (value || '').trim();
  }

  if (clean.fullName.length < 2 || clean.fullName.length > 80) {
    return { error: 'Full name must be 2 to 80 characters' };
  }
  const phoneDigits = clean.phone.replace(/\D/g, '');
  if (!/^\+?[0-9][0-9\s-]*$/.test(clean.phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return { error: 'Please enter a valid phone number' };
  }
  if (clean.street.length < 5 || clean.street.length > 200) {
    return { error: 'Street address must be 5 to 200 characters' };
  }
  if (clean.city.length < 2 || clean.city.length > 80) {
    return { error: 'City must be 2 to 80 characters' };
  }
  if (clean.zip.length > 12) {
    return { error: 'Zip code is too long' };
  }

  return { value: clean };
}

// ── Create Order ──────────────────────────────
async function createOrder(req, res) {
  try {
    // 💡 orderNote added in destructuring
    const { PaymentMethod, orderNote } = req.body;

    const shipping = validateShipping(req.body.shippingAddress);
    if (shipping.error) {
      return res.status(400).json({ success: false, message: shipping.error });
    }
    const shippingAddress = shipping.value;

    if (PaymentMethod !== undefined && !PAYMENT_METHODS.includes(PaymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
    if (orderNote !== undefined && (typeof orderNote !== 'string' || orderNote.length > 500)) {
      return res.status(400).json({ success: false, message: 'Order note must be text up to 500 characters' });
    }

    // 1. Cart lo
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // 2. Har item ko DB se resolve karo: price aur stock server se aate hain
    const lines = [];
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name}`
        });
      }

      const line = resolveLine(product, item.color, item.size);
      if (!line.ok) {
        return res.status(400).json({ success: false, message: line.error });
      }
      if (line.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${line.stock}`
        });
      }

      lines.push({
        productId:   item.product,
        color:       line.color,
        size:        line.size,
        quantity:    item.quantity,
        variantised: line.variantised,
      });

      orderItems.push({
        product:  item.product,
        name:     item.name,
        image:    line.image,
        color:    line.color,
        size:     line.size,
        quantity: item.quantity,
        price:    line.unitPrice,
      });
    }

    // 3. Stock atomically reserve karo (check aur minus ek hi step mein)
    const reserved = await reserveStock(lines);
    if (!reserved.ok) {
      return res.status(400).json({
        success: false,
        message: 'Some items just went out of stock. Please review your cart.'
      });
    }

    // 4. Order banao. Fail ho to stock wapas karo.
    let order;
    try {
      order = new Order({
        user:            req.user._id,
        orderItems,
        shippingAddress,
        PaymentMethod:   PaymentMethod || 'COD',
        orderNote:       orderNote || '',
      });
      order.calculateTotals();
      await order.save();
    } catch (err) {
      await releaseStock(lines);
      throw err;
    }

    // 7. Cart clear karo
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Get My Orders ─────────────────────────────
async function getMyOrders(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const total  = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Get Single Order ──────────────────────────
async function getSingleOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // order.user null ho sakta hai agar customer ka account delete ho chuka ho
    const ownerId = order.user?._id?.toString();
    if (
      ownerId !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Get All Orders — Admin Only ───────────────
async function getAllOrders(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const queryObj = {};
    if (req.query.status) {
      const status = String(req.query.status).toLowerCase();
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      queryObj.orderStatus = status;
    }

    const total  = await Order.countDocuments(queryObj);
    const orders = await Order.find(queryObj)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Revenue saare matching orders par (sirf is page par nahi), cancelled ke baghair
    const revenueMatch = { ...queryObj };
    if (!revenueMatch.orderStatus) revenueMatch.orderStatus = { $ne: 'cancelled' };
    const revenueAgg = revenueMatch.orderStatus === 'cancelled'
      ? []
      : await Order.aggregate([
          { $match: revenueMatch },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalRevenue,
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Update Order Status — Admin Only ──────────
async function updateOrderStatus(req, res) {
  try {
    const status = String(req.body.status || '').toLowerCase();

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${STATUSES.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus === status) {
      return res.status(200).json({ success: true, message: 'Order status unchanged', order });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled order cannot be changed'
      });
    }

    if (order.orderStatus === 'delivered' && status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Delivered order cannot be cancelled'
      });
    }

    if (status === 'cancelled') {
      await releaseStock(linesFromOrderItems(order.orderItems));
      await settlePaymentOnCancel(order);
    }

    order.UpdateOrderStatus(status);
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ── Cancel Order — Customer ───────────────────
async function cancelOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (order.orderStatus !== 'processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel — order is ${order.orderStatus}`
      });
    }

    await releaseStock(linesFromOrderItems(order.orderItems));
    await settlePaymentOnCancel(order);

    order.UpdateOrderStatus('cancelled');
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getSingleOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};