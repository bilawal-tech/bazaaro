const mongoose = require('mongoose'); 
const Product = require('../models/Product');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const { buildVariants } = require('../utils/variants');

// ── Multer Storage Configuration (Accepts ALL image types) ───
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Wildcard content-type checks any incoming image file extension
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image assets are allowed system-wide!'), false);
    }
  }
})

async function createProduct(req, res) {
  try {
    const {
      name, brand, description, costPrice, price,
      discountPrice, category, stock, variants, unitType
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required',
        field: 'name'
      });
    }

    const hasVariantInput = Array.isArray(variants) ? variants.length > 0 : !!variants;
    if (!hasVariantInput && (!price || Number(price) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price is required',
        field: 'price'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        field: 'category'
      });
    }

    const categoryExist = await Category.findById(category);
    if (!categoryExist) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        field: 'category'
      });
    }

    // Process base images
    let images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (!file.fieldname.startsWith('variant_')) {
          images.push({ url: `/uploads/products/${file.filename}` });
        }
      });
    }

    // Process variants (validate + images)
    let processedVariants = [];
    if (variants) {
      try {
        const variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
        processedVariants = buildVariants(variantsData, req.files || []);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          field: 'variants'
        });
      }
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      brand: brand?.trim() || '',
      description: description?.trim() || '',
      costPrice: costPrice ? Number(costPrice) : 0,
      price: Number(price) || 0,
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      category,
      unitType: unitType || 'unit',
      stock: Number(stock) || 0,
      images,
      variants: processedVariants,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create Product Error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }

}
// ── Get All Products — Filters + Pagination ───
async function getAllProducts(req, res) {
  try {
    // ── Filters ───────────────────────────────
    const queryObj = {};

    // Category filter:
    if (req.query.category) {
      queryObj.category = req.query.category;
    }

    // Price filter :
    if (req.query.minprice || req.query.maxprice) {
      queryObj.price = {};
      if (req.query.minprice) queryObj.price.$gte = Number(req.query.minprice);
      if (req.query.maxprice) queryObj.price.$lte = Number(req.query.maxprice);
    }

    // Stock filter:
    if (req.query.instock === 'true') {
      queryObj.stock = { $gt: 0 };
    }

    // Search — name se:
    if (req.query.search) {
      queryObj.name = {
        $regex:   req.query.search,
        $options: 'i', // case insensitive
      };
    }

    // ── Sorting 
    // Dono style chalte hain: sortby=-price  ya  sortby=price&sortorder=asc
    const SORTABLE = ['createdAt', 'price', 'name', 'ratings', 'stock'];
    let sortBy = { createdAt: -1 }; // default — latest pehle
    if (req.query.sortby) {
      const raw = String(req.query.sortby);
      const descending = raw.startsWith('-');
      const sortField = raw.replace(/^[-+]/, '');
      if (SORTABLE.includes(sortField)) {
        const order = raw.startsWith('-') || raw.startsWith('+')
          ? (descending ? -1 : 1)
          : (req.query.sortorder === 'asc' ? 1 : -1);
        sortBy = { [sortField]: order };
      }
    }

    // ── Pagination ────────────────────────────
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // ── Query Execute ─────────────────────────
    const total    = await Product.countDocuments(queryObj);
    const products = await Product.find(queryObj)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// ── Get Single Product ────────────────────────
async function getSingleProduct(req, res) {
  try {
    const { id } = req.params;

    // ID ho to ID se, warna slug se dhoondo
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };

    const product = await Product.findOne(filter)
      .populate('category', 'name slug')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

async function getproductBySlug(req, res) {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate('category', 'name slug')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// ── Update Product — Admin Only ───────────────
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name, brand, description, costPrice, price,
      discountPrice, category, stock, variants
    } = req.body;

    // ⚡ Fixed: Safe Category Update & Existence Check
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ success: false, message: 'Invalid Target Category ID format' });
      }
      const categoryExist = await Category.findById(category);
      if (!categoryExist) {
        return res.status(404).json({ success: false, message: 'Target Category not found' });
      }
      product.category = category;
    }

    // Base images: sirf nayi aayen to replace; variant_ wali files alag handle hoti hain
    const baseFiles = (req.files || []).filter(f => !f.fieldname.startsWith('variant_'));
    if (baseFiles.length > 0) {
      product.images = baseFiles.map(file => ({
        url: `/uploads/products/${file.filename}`
      }));
    }

    if (name)                 product.name          = name;
    if (brand !== undefined)  product.brand         = brand;
    if (description)          product.description   = description;
    if (costPrice !== undefined) product.costPrice  = Number(costPrice);
    if (price)                product.price         = Number(price);
    
    if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
    if (stock !== undefined)  product.stock         = Number(stock);
    if (variants) {
      try {
        const variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
        product.variants = buildVariants(variantsData, req.files || []);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message, field: 'variants' });
      }
    }

    await product.save(); 

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// ── Delete Product — Admin Only ───────────────
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// ── Add Review ────────────────────────────────
async function addReview(req, res) {
  try {
    const { rating, comment } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const alreadyReviewed = product.reviews.find(
      review => review.user?.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      product.reviews.forEach(review => {  
        if (review.user?.toString() === req.user._id.toString()) {
          review.rating  = Number(rating);
          review.comment = comment;
        }
      });
    } else {
      product.reviews.push({
        user:    req.user._id,
        name:    req.user.name,
        rating:  Number(rating),
        comment,
      });
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: alreadyReviewed
        ? 'Review updated successfully'
        : 'Review added successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// ── Delete Review ─────────────────────────────
async function deleteReview(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.reviews = product.reviews.filter(
      review => review.user?.toString() !== req.user._id.toString()
    );

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
  getproductBySlug,
  upload 
};