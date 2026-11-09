const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  getProfile,
  getallUsers,
  deleteUser,
  updateUserProfile,
} = require('../controller/authcontroller');
const { protect, adminOnly } = require('../middleware/AuthMiddleware');


router.post('/register', register);
router.post('/login',    login);

// Protected Routes — Login Zaroori 
router.get ('/profile', protect, getProfile);
router.put ('/profile', protect, updateUserProfile);

// Admin Only Routes
router.get   ('/users',  protect, adminOnly,     getallUsers);
router.delete('/users/:id',  protect, adminOnly, deleteUser);

module.exports = router;