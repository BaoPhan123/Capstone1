const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");


// Tạo order từ giỏ hàng
exports.createOrderFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const notes = "";

        // Lấy giỏ hàng
        const cart = await Cart.findOne({ user: userId }).populate("items.product", "-embedding");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng trống"
            });
        }

        // Kiểm tra tính khả dụng của các sản phẩm
        for (const item of cart.items) {
            if (!item.product || !item.product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm "${item.name}" hiện không còn bán`
                });
            }
        }

        // Tạo order items từ cart items với subtotal
        const orderItems = cart.items.map(item => {
            const price = item.product.finalPrice || item.product.price;
            return {
                product: item.product._id,
                name: item.product.name,
                price: price,
                quantity: item.quantity,
                subtotal: price * item.quantity
            };
        });

        // Tính subtotal và totalAmount
        const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalAmount = subtotal; // Có thể thêm tax, deliveryFee, discount sau

        // Tạo order
        const order = new Order({
            user: userId,
            items: orderItems,
            subtotal: subtotal,
            totalAmount: totalAmount,
            notes: notes,
            status: "pending",
            paymentStatus: "pending"
        });

        await order.save();

        // Xóa giỏ hàng sau khi tạo order
        cart.items = [];
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Tạo đơn hàng từ giỏ hàng thành công",
            data: order
        });

    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng từ giỏ:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi tạo đơn hàng"
        });
    }
};

// Lấy danh sách order của user
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ user: userId })
            .populate("items.product", "name images")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đơn hàng thành công",
            data: orders
        });

    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy đơn hàng"
        });
    }
};

// Lấy chi tiết một order
exports.getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate("items.product", "name thumbnail images price");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy chi tiết đơn hàng thành công",
            data: order
        });

    } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy chi tiết đơn hàng"
        });
    }
};

// Hủy order (chỉ khi còn pending)
exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const { cancelReason } = req.body;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }

        if (!['pending'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: "Không thể hủy đơn hàng đã được xác nhận hoặc đang giao"
            });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: "Không thể hủy đơn hàng đã thanh toán. Vui lòng liên hệ hỗ trợ để được hoàn tiền."
            });
        }

        // Hoàn lại số lượng tồn kho cho từng sản phẩm
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        order.status = "cancelled";
        order.cancelledAt = new Date();
        order.cancelReason = cancelReason || "Người dùng hủy";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Hủy đơn hàng thành công",
            data: order
        });

    } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi hủy đơn hàng"
        });
    }
};
