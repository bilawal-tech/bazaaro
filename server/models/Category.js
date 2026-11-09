const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: 'uploads/default_category.png',
    },
  },
  { timestamps: true }
);

// slug automatically genrate name from name
CategorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      replacement: '-',
    });
  }
});

module.exports = mongoose.model('Category', CategorySchema);