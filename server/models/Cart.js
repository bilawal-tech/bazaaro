const mongoose = require('mongoose');
const { resolveLine } = require('../utils/variants');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  color: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  productAtAddedPrice: {
    type: Number,
    required: true,
  },
  currentProductPrice: {
    type: Number,
    required: true,
  },
});

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    // Cart ab delete nahi hota (pehle TTL se 24 ghante baad ura diya jata tha).
    // Abandoned cart analytics ke liye last activity ka time rakhte hain.
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// ── 1. Totals calculate karo ──────────────────
CartSchema.methods.calculateTotals = function () {
  this.totalPrice = 0;
  this.totalQuantity = 0;

  this.items.forEach((item) => {
    this.totalPrice    += item.currentProductPrice * item.quantity;
    this.totalQuantity += item.quantity;
  });
};

// ── 2. Prices sync karo DB se (variant level) ─
CartSchema.methods.updateProductPrices = async function () {
  const Product = mongoose.model('Product');

  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const line = resolveLine(product, item.color, item.size);
    if (line.ok) item.currentProductPrice = line.unitPrice;
  }
  this.calculateTotals();
};

CartSchema.pre('save', function () {
  if (this.isModified('items')) {
    this.calculateTotals();
  }
  this.lastActivityAt = new Date();
});

module.exports = mongoose.model('Cart', CartSchema);
