const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../controller/payment');
const { protect } = require('../middleware/authMiddleware');

// Webhook yahan nahi: raw body ke liye server.js mein express.json se pehle lagta hai.
router.post('/create-intent', protect, createPaymentIntent);

module.exports = router;
