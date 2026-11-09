const express = require('express');
const router  = express.Router();
const {
  addToCart,
  getCart,
  updateCart,
  removeFromCart,
  clearCart,
} = require('../controller/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCart);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);

module.exports = router;