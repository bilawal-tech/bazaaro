const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// 1. ADD TO CART (CART ME ITEM DAALNA)
// 2. New Logic: Color aur Size ke hisaab se item ko identify karne ke liye findIndex mein condition add kiya
// 3. new item krna hai to push karo, nahi to quantity update karo
async function addToCart(req, res) {
    try {
        const { productId, quantity, color, size } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        if (product.stock < 1) {
            return res.status(400).json({ success: false, message: 'Product is out of stock' });
        }

        // set default quantity to 1 if not provided
        const requestedQty = quantity || 1;        
        if (requestedQty > product.stock) {
            return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
        }

        // consider discount price if available, otherwise use regular price
        const currentPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

        let cart = await Cart.findOne({ user: req.user._id });
        
        // ── SCENARIO A: Agar user ki pehli cart hi nahi bani hui ──
        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: [{
                    product: productId,
                    name: product.name,
                    image: product.images[0] || '', // primary image path saved
                    color: color || null,
                    size: size || null,
                    quantity: requestedQty,
                    productAtAddedPrice: currentPrice, 
                    currentProductPrice: currentPrice,
                }]
            });
            return res.status(201).json({ success: true, message: 'Product added to cart', cart });
        }

        // ── SCENARIO B: User ki cart pehle se hai, to usmein item add/update karna hai ──
        //  Linear Search (findIndex)
        const itemindex = cart.items.findIndex(
            item => item.product.toString() === productId &&
                    item.color === (color || null) &&
                    item.size === (size || null)
        );

        if (itemindex > -1) {
            // [NEW LOGIC - BUG FIX]: Direct '+=' karne se RAM mein data kharab hota tha agar check fail ho jaye.
            const newQuantity = cart.items[itemindex].quantity + requestedQty;
            
            if (newQuantity > product.stock) {
                return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
            }
            cart.items[itemindex].quantity = newQuantity;
        } 
        else {
            // new item added, or push
            cart.items.push({
                product: productId,
                name: product.name,
                image: product.images[0] || '',
                color: color || null,
                size: size || null,
                quantity: requestedQty,
                productAtAddedPrice: currentPrice,
                currentProductPrice: currentPrice,
            });
        }
        // Bill caluclate on model (creating pre save hook in Cart model)
        await cart.save();
        return res.status(200).json({ success: true, message: 'Item added to cart', cart });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// get details and fetch cart, with live product details 
async function getCart(req, res) {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price discountPrice images stock');
            
        // ..using good respone structure even when cart is empty, taake frontend pe handle karna easy ho jaye.
        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is empty',
                cart: { items: [], totalPrice: 0, totalQuantity: 0 } // Fixed camelCase matching frontend slice
            });
        }

        // safety check for updatedProductPrices method existence before calling it
        if (Cart.updateProductPrices && typeof Cart.updateProductPrices === 'function') {
            await Cart.updateProductPrices();
        }
        
        await cart.save(); 

        return res.status(200).json({ success: true, message: 'Cart retrieved successfully', cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// updated the color, size or quantity(min/max)
async function updateCart(req, res) {
    try {
        const { quantity, color, size } = req.body;
        const { itemId } = req.params; 
        
        if (!quantity && !color && !size) {
            return res.status(400).json({ success: false, message: 'Please provide quantity, color or size to update' });
        }
        
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        
        // Linear search to find the item
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        if (quantity !== undefined) {
            if (quantity < 1) {
                return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
            }
        
            const product = await Product.findById(cart.items[itemIndex].product);
            if (product && quantity > product.stock) {
                return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
            }
        
            cart.items[itemIndex].quantity = quantity;
        }
        
        if (color !== undefined) cart.items[itemIndex].color = color;
        if (size !== undefined) cart.items[itemIndex].size = size;

        await cart.save();
        return res.status(200).json({ success: true, message: 'Cart updated successfully', cart });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// Clear the entire cart (saare items ko ek sath urrana)
async function clearCart(req, res) {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        
        // remove all items
        cart.items = [];
        
        await cart.save();
        return res.status(200).json({ success: true, message: 'Cart cleared successfully', cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// remove a single item from cart
async function removeFromCart(req, res) {
    try {
        const { itemId } = req.params;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        
        // safety check for item existence before filtering,
        // create new array with filter and compare lengths to determine if item was found and removed
        const beforeFilterLength = cart.items.length;
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);

        if (cart.items.length === beforeFilterLength) {
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
    removeFromCart
};