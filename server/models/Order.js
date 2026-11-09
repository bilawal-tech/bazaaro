const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    color: {
        type: String,
        default: null,
    },
    size: {
        type: String,
        default: null,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1,
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price must be a positive number'],
    }
});

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderItems: [OrderItemSchema],

    // Shipping details
    shippingAddress: {
        fullName: {
            type: String,
            required: [true, 'Please enter full name'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Please enter phone number'],
            trim: true,
        },
        street: {
            type: String,
            required: [true, 'Please enter street address'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'Please enter city'],
            trim: true,
        },
        zip: {
            type: String,
            trim: true,
        },
    },

    // Payment details
    PaymentMethod: {
        type: String,
        enum: ['COD', 'Credit Card', 'Jazzcash', 'Bank Transfer', 'Easypaisa'],
        required: [true, 'Payment method is required'],
        default: 'COD',
    },
    PaymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        required: [true, 'Payment status is required'],
        default: 'Pending',
    },
    paidAt: {
        type: Date,
        default: null,
    },

    //pircing details
    itemsPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },

    // Order status
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        required: [true, 'Order status is required'],
        default: 'Processing',
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    // 💡 Order Note field added strictly here
    orderNote: {
        type: String,
        trim: true,
        default: '',
    },
}, { timestamps: true });

OrderSchema.methods.calculateTotals = function () {
    this.itemsPrice = this.orderItems.reduce((acc,items)=> {
        return acc + items.price * items.quantity;
    }, 0);
    
    this.shippingPrice = this.itemsPrice > 1000 ? 0 : 200;
    this.totalPrice = this.itemsPrice + this.shippingPrice;
}

OrderSchema.methods.UpdateOrderStatus = function (newStatus) {
    this.orderStatus = newStatus;

    if (newStatus === 'Delivered') {
        this.deliveredAt = Date.now();
        this.PaymentStatus = 'Completed';
        this.paidAt = Date.now();
    } 
    if (newStatus === 'Cancelled') {
        this.cancelledAt = Date.now();
    }
}

OrderSchema.pre('save', function () {
    if (this.isModified('orderItems')) {
        this.calculateTotals();
    }   
});

module.exports = mongoose.model('Order', OrderSchema);