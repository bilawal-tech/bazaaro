const express = require('express'); 
const router = express.Router();
const { createCategory,
    getAllCategories,
    SingleCategory,
    updateCategory,
    deleteCategory
} = require('../controller/Category');
const { protect, adminOnly } = require('../middleware/AuthMiddleware');

router.post('/create', protect, adminOnly, createCategory);
router.get('/all', getAllCategories);
router.get('/:slug', SingleCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;