const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String },
    quantity: { 
        type: Number, 
        required: true, 
        min: 1,
        default: 1
    },
    subtotal: { type: Number, required: true, min: 0 }
}, { _id: true, timestamps: true });

const CartSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        unique: true
    },
    items: [CartItemSchema],
    totalItems: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 }
}, {
    timestamps: true
});

// Index để tìm giỏ hàng theo user nhanh hơn
CartSchema.index({ user: 1 });

// Tính toán lại tổng tiền và số lượng sản phẩm trước khi lưu
CartSchema.pre("save", function (next) {
    if (this.items && this.items.length > 0) {
        // Tính subtotal cho từng item
        this.items.forEach(item => {
            item.subtotal = item.price * item.quantity;
        });

        // Tính tổng số lượng sản phẩm
        this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);

        // Tính tổng tiền
        this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    } else {
        this.totalItems = 0;
        this.totalAmount = 0;
    }
    next();
});

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
