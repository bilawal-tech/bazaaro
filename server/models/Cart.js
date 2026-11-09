const mongoose = require('mongoose');

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
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Cart expire hone ke liye index lagao
// index({ expireAt: 1 } => apply on this index 
//{ expireAfterSeconds: 0 }); => after deadline o secomds ke baad delete kar do
CartSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// ── 1. Totals calculate karo ──────────────────
CartSchema.methods.calculateTotals = function () {
  this.totalPrice = 0;
  this.totalQuantity = 0;

  // DSA: O(n) — ek baar mein dono
  this.items.forEach((item) => {
    this.totalPrice    += item.currentProductPrice * item.quantity;
    this.totalQuantity += item.quantity;
  });
};

// ── 2. Prices sync karo DB se ─────────────────
CartSchema.methods.updateProductPrices = async function () {
  const Product = mongoose.model('Product');

  for (let item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      item.currentProductPrice = product.discountPrice > 0
        ? product.discountPrice
        : product.price;
    }
  }
  this.calculateTotals();
};


CartSchema.pre('save', function () {
  if (this.isModified('items')) {
    this.calculateTotals();
  }
 
});

module.exports = mongoose.model('Cart', CartSchema);