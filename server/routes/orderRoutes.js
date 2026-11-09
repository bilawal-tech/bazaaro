const express = require('express');
const router  = express.Router();
const {
  createOrder,
  getMyOrders,
  getSingleOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controller/order');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Customer Routes ───────────────────────────
router.post('/',              protect, createOrder);
router.get ('/my',            protect, getMyOrders);
router.get ('/:id',           protect, getSingleOrder);
router.put ('/:id/cancel',    protect, cancelOrder);

// ── Admin Only ────────────────────────────────
router.get ('/',              protect, adminOnly, getAllOrders);
router.put ('/:id/status',    protect, adminOnly, updateOrderStatus);

module.exports = router;