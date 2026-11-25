const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  getallUsers,
  deleteUser,
  updateUserProfile,
} = require('../controller/authcontroller');
const { protect, adminOnly } = require('../middleware/authMiddleware');


router.post('/register', register);
router.post('/login',    login);
router.post('/google',   googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected Routes — Login Zaroori 
router.get ('/profile', protect, getProfile);
router.put ('/profile', protect, updateUserProfile);

// Admin Only Routes
router.get   ('/users',  protect, adminOnly,     getallUsers);
router.delete('/users/:id',  protect, adminOnly, deleteUser);

module.exports = router;