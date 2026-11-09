const mongoose = require('mongoose'); 
const Product = require('../models/Product');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');

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

    if (!price || Number(price) <= 0) {
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

    // Process variants
    let processedVariants = [];
    if (variants) {
      try {
        const variantsData = typeof variants === 'string' 
          ? JSON.parse(variants) 
          : variants;

        processedVariants = variantsData.map((variant, variantIdx) => {
          const variantImageKey = `variant_${variantIdx}_image`;
          const variantImageFile = req.files?.find(f => f.fieldname === variantImageKey);

          return {
            color: variant.color,
            image: variantImageFile 
              ? `/uploads/products/${variantImageFile.filename}` 
              : null,
            sizes: variant.sizes.map((size, sizeIdx) => {
              const sizeImageKey = `variant_${variantIdx}_size_${sizeIdx}_image`;
              const sizeImageFile = req.files?.find(f => f.fieldname === sizeImageKey);

              return {
                size: size.size,
                stock: Number(size.stock),
                price: Number(size.price),
                costPrice: Number(size.costPrice) || 0,
                discountPrice: Number(size.discountPrice) || 0,
                image: sizeImageFile 
                  ? `/uploads/products/${sizeImageFile.filename}` 
                  : null
              };
            })
          };
        });
      } catch (err) {
        console.error('Variant parsing error:', err);
        processedVariants = [];
      }
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      brand: brand?.trim() || '',
      description: description?.trim() || '',
      costPrice: costPrice ? Number(costPrice) : 0,
      price: Number(price),
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
    let sortBy = { createdAt: -1 }; // default — latest pehle
    if (req.query.sortby) {
      const sortField = req.query.sortby;
      const sortOrder = req.query.sortorder === 'asc' ? 1 : -1;
      sortBy = { [sortField]: sortOrder };
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

    // CastError Protection
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(id)
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

    // New image fields logic for edit flow
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`
      }));
      product.images = newImages; 
    }

    if (name)                 product.name          = name;
    if (brand !== undefined)  product.brand         = brand;
    if (description)          product.description   = description;
    if (costPrice !== undefined) product.costPrice  = Number(costPrice);
    if (price)                product.price         = Number(price);
    
    if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
    if (stock !== undefined)  product.stock         = Number(stock);
    if (variants)             product.variants      = typeof variants === 'string' ? JSON.parse(variants) : variants;

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