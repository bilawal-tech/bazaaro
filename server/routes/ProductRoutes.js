const express = require('express');
const router  = express.Router();
const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
  getproductBySlug,
  upload
} = require('../controller/productController');
const { protect, adminOnly } = require('../middleware/AuthMiddleware');

// Public Routes 
router.get('/',    getAllProducts);//ok

// ── Admin Only ────────────────────────────────
router.post  ('/',    protect, adminOnly,  upload.any(), createProduct); //ok
router.put   ('/:id', protect, adminOnly, upload.array('images'), updateProduct);//ok
router.delete('/:id', protect, adminOnly, deleteProduct);//ok
router.get('/:id', protect,  getSingleProduct);//ok

// Public Routes 
router.get('/:slug', getproductBySlug);//ok

//  Protected must be logged in to review
router.post  ('/:id/reviews', protect, addReview);
router.delete('/:id/reviews', protect, deleteReview);

module.exports = router;