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
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Public Routes ─────────────────────────────
router.get('/',            getAllProducts);
router.get('/slug/:slug',  getproductBySlug);
router.get('/:id',         getSingleProduct); // id ya slug dono

// ── Admin Only ────────────────────────────────
router.post  ('/',    protect, adminOnly, upload.any(), createProduct);
router.put   ('/:id', protect, adminOnly, upload.any(), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

//  Protected must be logged in to review
router.post  ('/:id/reviews', protect, addReview);
router.delete('/:id/reviews', protect, deleteReview);

module.exports = router;