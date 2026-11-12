const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { resolveLine } = require('../utils/variants');

const normalize = (v) => (v === undefined || v === '' ? null : v);

// 1. ADD TO CART
// Item ki pehchan: product + color + size. Price aur stock hamesha variant se
// DB se aate hain, client ka bheja hua price kabhi nahi liya jata.
async function addToCart(req, res) {
    try {
        const { productId } = req.body;
        const color = normalize(req.body.color);
        const size = normalize(req.body.size);
        const requestedQty = Number(req.body.quantity) || 1;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        if (!Number.isInteger(requestedQty) || requestedQty < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const line = resolveLine(product, color, size);
        if (!line.ok) {
            return res.status(400).json({ success: false, message: line.error });
        }
        if (line.stock < 1) {
            return res.status(400).json({ success: false, message: 'Product is out of stock' });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        const existing = cart.items.find(
            (item) =>
                item.product.toString() === productId &&
                item.color === line.color &&
                item.size === line.size
        );

        const newQuantity = (existing ? existing.quantity : 0) + requestedQty;
        if (newQuantity > line.stock) {
            return res.status(400).json({ success: false, message: `Only ${line.stock} items in stock` });
        }

        if (existing) {
            existing.quantity = newQuantity;
            existing.currentProductPrice = line.unitPrice;
        } else {
            cart.items.push({
                product: productId,
                name: product.name,
                image: line.image,
                color: line.color,
                size: line.size,
                quantity: requestedQty,
                productAtAddedPrice: line.unitPrice,
                currentProductPrice: line.unitPrice,
            });
        }

        await cart.save();
        return res.status(existing ? 200 : 201).json({
            success: true,
            message: 'Item added to cart',
            cart,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// Cart lo, prices DB se sync karke
async function getCart(req, res) {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is empty',
                cart: { items: [], totalPrice: 0, totalQuantity: 0 },
            });
        }

        await cart.updateProductPrices();
        await cart.save();
        await cart.populate('items.product', 'name price discountPrice images stock variants');

        return res.status(200).json({ success: true, message: 'Cart retrieved successfully', cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// quantity, color ya size update karo
async function updateCart(req, res) {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const color = req.body.color;
        const size = req.body.size;

        if (quantity === undefined && color === undefined && size === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide quantity, color or size to update' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const product = await Product.findById(item.product);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product no longer exists' });
        }

        const newColor = color !== undefined ? normalize(color) : item.color;
        const newSize = size !== undefined ? normalize(size) : item.size;
        const newQty = quantity !== undefined ? Number(quantity) : item.quantity;

        if (!Number.isInteger(newQty) || newQty < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        const line = resolveLine(product, newColor, newSize);
        if (!line.ok) {
            return res.status(400).json({ success: false, message: line.error });
        }
        if (newQty > line.stock) {
            return res.status(400).json({ success: false, message: `Only ${line.stock} items in stock` });
        }

        // Color/size badalne par agar cart mein wahi variant pehle se hai to merge karo
        const duplicate = cart.items.find(
            (other) =>
                other._id.toString() !== itemId &&
                other.product.toString() === item.product.toString() &&
                other.color === line.color &&
                other.size === line.size
        );
        if (duplicate) {
            const merged = duplicate.quantity + newQty;
            if (merged > line.stock) {
                return res.status(400).json({ success: false, message: `Only ${line.stock} items in stock` });
            }
            duplicate.quantity = merged;
            cart.items.pull(itemId);
        } else {
            item.color = line.color;
            item.size = line.size;
            item.quantity = newQty;
            item.image = line.image;
            item.currentProductPrice = line.unitPrice;
        }

        await cart.save();
        return res.status(200).json({ success: true, message: 'Cart updated successfully', cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// Poori cart khali karo
async function clearCart(req, res) {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();
        return res.status(200).json({ success: true, message: 'Cart cleared successfully', cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// Ek item hatao
async function removeFromCart(req, res) {
    try {
        const { itemId } = req.params;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const before = cart.items.length;
        cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

        if (cart.items.length === before) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        await cart.save();
        return res.status(200).json({ success: true, message: 'Item removed from cart successfully', cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

module.exports = {
    addToCart,
    getCart,
    updateCart,
    clearCart,
    removeFromCart,
};
