const Category = require('../models/Category');
const Product = require('../models/Product'); 
const slugify = require('slugify');

// ── Create Category ───────────────────────────
async function createCategory(req, res) {
    try {
        const { name, description, image } = req.body;
        
        const CategoryExist = await Category.findOne({ name });
        if (CategoryExist) {
            return res.status(400).json({ message: 'Category already exist' });
        }

        // ✅ Bug Fixed: Category banate waqt slug bhi generate karke bhej rahe hain
        const slug = slugify(name, { lower: true, strict: true });

        const category = await Category.create({ name, slug, description, image });
        
        console.log(category);
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// ── Get All Categories ────────────────────────
async function getAllCategories(req, res) {
    try {
        const AllCategories = await Category.find({});
        res.status(200).json({
            message: 'All Categories',
            total: AllCategories.length,
            AllCategories
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// ── Single Category ───────────────────────────
async function SingleCategory(req, res) {
    const { slug } = req.params;
    try {
        const category = await Category.findOne({ slug });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category found', category });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// ── Update Category ───────────────────────────
async function updateCategory(req, res) {
    const { id } = req.params;
    const { name, description, image } = req.body;
    
    try {
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Category ID format" 
            });
        }

        
        let category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }   

        // 3. Fields update karein
        if (name) {
            category.name = name;
            //Slug sirf tabhi badle jab naya naam aaya ho
            category.slug = slugify(name, { lower: true, strict: true });
        }
        
        if (description) category.description = description;
        if (image)       category.image = image;
 
        await category.save();
        
      
        return res.status(200).json({ 
            success: true,
            message: 'Category updated successfully', 
            category 
        });           
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
}

// ── Delete Category ───────────────────────────
async function deleteCategory(req, res) {
    const { id } = req.params;  
    
    try {
        // CastError Protection (Invalid ID format check)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Category ID format" 
            });
        }

        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

     
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Category cannot be deleted. It has associated products."
            });
        }

      
        await Category.findByIdAndDelete(id);
        
        res.status(200).json({ success: true, message: "Category deleted successfully" });     

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });     
    }
}

module.exports = {
    createCategory,
    getAllCategories,
    SingleCategory,
    updateCategory,
    deleteCategory
};