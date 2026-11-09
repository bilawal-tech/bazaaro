const mongoose = require('mongoose');
const slugify = require('slugify');

const SizeSchema = new mongoose.Schema({
  size: { type: String, required: true, trim: true },
  stock: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  discountPrice: { type: Number, default: 0 },
  image: { type: String },
});

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true, trim: true },
  image: { type: String },
  sizes: [SizeSchema],
});

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name required'], trim: true },
    brand: { type: String, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true },

    costPrice: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'Price required'] },
    discountPrice: { type: Number, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    unitType: {
      type: String,
      enum: ['unit', 'kg', 'gram', 'liter', 'packet', 'dozen'],
      default: 'unit'
    },
    stock: { type: Number, default: 0 },

    images: [{ url: { type: String } }],
    variants: [VariantSchema],

    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [ReviewSchema],
  },
  { timestamps: true }
);

ProductSchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.isModified('reviews')) {
    this.calculateRatings();
  }
});

ProductSchema.methods.calculateRatings = function() {
  if (this.reviews.length === 0) {
    this.ratings = 0;
    this.numReviews = 0;
    return;
  }
  const total = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.ratings = Number((total / this.reviews.length).toFixed(1));
  this.numReviews = this.reviews.length;
};

module.exports = mongoose.model('Product', ProductSchema);