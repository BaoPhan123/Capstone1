const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],

    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
        type: String,
        enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
        default: "pending"
    },

    shippingAddress: { type: String, required: true },
    shippingCode: { type: String },
    shippingProvider: { type: String },

    paymentMethod: {
        type: String,
        enum: [ "zalopay", "banking"],
        default: "zalopay"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },

    notes: { type: String },

    confirmedAt: { type: Date },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    shippingAt: { type: Date },
    deliveringAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String }
}, {
    timestamps: true
});

// Indexes for better query performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ completedAt: 1 });

// Calculate subtotal before saving
OrderSchema.pre("save", function (next) {
    if (this.items && this.items.length > 0) {
        this.subtotal = this.items.reduce((sum, item) => {
            item.subtotal = item.price * item.quantity;
            return sum + item.subtotal;
        }, 0);

        // Calculate total amount
        this.totalAmount = this.subtotal + this.tax + this.deliveryFee - this.discount;
    }
    next();
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
