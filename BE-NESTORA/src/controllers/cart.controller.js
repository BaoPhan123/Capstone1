const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const { config: zaloConfig, computeMac } = require("../utils/zalo");
const { sendDiscountCode } = require("../utils/mailer");
const {
    DISCOUNT_PERCENT,
    normalizeDiscountCode,
    isValidDiscountCode,
    getRandomDiscountCode
} = require("../constants/discountCodes");
const https = require("https");

function calculateCouponDiscount(subtotal, couponCode) {
    const normalizedCode = normalizeDiscountCode(couponCode);
    if (!normalizedCode) return { discountAmount: 0, discountCode: "" };
    if (!isValidDiscountCode(normalizedCode)) {
        const error = new Error("Mã giảm giá không hợp lệ");
        error.statusCode = 400;
        throw error;
    }
    return {
        discountAmount: Math.round(Number(subtotal || 0) * DISCOUNT_PERCENT / 100),
        discountCode: normalizedCode
    };
}

async function sendNextOrderDiscountEmail(order) {
    const email = order?.user?.email;
    if (!email) return;

    try {
        await sendDiscountCode(email, getRandomDiscountCode(), order.user?.name || "bạn");
    } catch (mailError) {
        console.error("Lỗi gửi mã giảm giá:", mailError);
    }
}

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        let cart = await Cart.findOne({ user: userId }).populate("items.product", "name price images");

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy giỏ hàng thành công",
            data: cart
        });
    } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy giỏ hàng"
        });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }

        if (product.stock <= 0) {
            return res.status(400).json({
                success: false,
                message: "Sản phẩm hiện đã hết hàng"
            });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            const nextQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (nextQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${product.name} không đủ số lượng (còn ${product.stock})`
                });
            }
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].price = product.price;
        } else {
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${product.name} không đủ số lượng (còn ${product.stock})`
                });
            }
            const image = product.images && product.images.length > 0 ? product.images[0] : "";
            cart.items.push({
                product: productId,
                name: product.name,
                price: product.price,
                image: image,
                quantity: quantity,
                subtotal: product.price * quantity
            });
        }

        await cart.save();
        await cart.populate("items.product", "name price images");

        return res.status(200).json({
            success: true,
            message: "Thêm vào giỏ hàng thành công",
            data: cart
        });
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: "Lỗi máy chủ khi thêm vào giỏ hàng"
        });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId, quantity } = req.body;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giỏ hàng"
            });
        }

        const item = cart.items.id(cartItemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm trong giỏ hàng"
            });
        }

        const product = await Product.findById(item.product);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Sản phẩm không tồn tại"
            });
        }

        item.quantity = quantity;
        item.price = product.price;

        await cart.save();
        await cart.populate("items.product", "name price images");

        return res.status(200).json({
            success: true,
            message: "Cập nhật giỏ hàng thành công",
            data: cart
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật giỏ hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi cập nhật giỏ hàng"
        });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giỏ hàng"
            });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== cartItemId);

        await cart.save();
        await cart.populate("items.product", "name price images");

        return res.status(200).json({
            success: true,
            message: "Xóa sản phẩm khỏi giỏ hàng thành công",
            data: cart
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi xóa sản phẩm khỏi giỏ hàng"
        });
    }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giỏ hàng"
            });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Xóa toàn bộ giỏ hàng thành công",
            data: cart
        });
    } catch (error) {
        console.error("Lỗi khi xóa giỏ hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi xóa giỏ hàng"
        });
    }
};

function generateAppTransId() {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const unique = Date.now();
    return `${dateStr}_order_${unique}`;
}

async function postJson(url, payload) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const data = JSON.stringify(payload);
        const options = {
            hostname: u.hostname,
            port: u.port || 443,
            path: u.pathname + (u.search || ''),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

exports.checkout = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const {
            paymentMethod = "cash",
            notes,
            shippingAddress,
            deliveryFee = 0,
            couponCode
        } = req.body;

        const cart = await Cart.findOne({ user: userId }).session(session);
        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng trống"
            });
        }

        for (const item of cart.items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Sản phẩm ${item.name} không tồn tại`
                });
            }

            if (product.stock < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${item.name} không đủ số lượng (còn ${product.stock})`
                });
            }
        }

        const orderItems = cart.items.map(item => ({
            product: item.product,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal
        }));

        const subtotal = cart.totalAmount;
        const tax = 0;
        const { discountAmount, discountCode } = calculateCouponDiscount(subtotal, couponCode);
        const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount + tax);

        const order = await Order.create([{
            user: userId,
            items: orderItems,
            subtotal,
            tax,
            deliveryFee,
            discount: discountAmount,
            discountCode: discountCode || undefined,
            totalAmount,
            paymentMethod,
            paymentStatus: paymentMethod === "cash" ? "pending" : "pending",
            status: "pending",
            shippingAddress,
            notes
        }], { session });

        for (const item of cart.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } },
                { session }
            );
        }

        const payment = await Payment.create([{
            order: order[0]._id,
            user: userId,
            amount: totalAmount,
            method: paymentMethod,
            status: paymentMethod === "cash" ? "pending" : "pending"
        }], { session });

        cart.items = [];
        await cart.save({ session });

        await session.commitTransaction();

        const populatedOrder = await Order.findById(order[0]._id)
            .populate("user", "name email phone")
            .populate("items.product", "name images");

        if (paymentMethod === "zalopay") {
            const app_trans_id = generateAppTransId();

            payment[0].transactionId = app_trans_id;
            await payment[0].save();

            const app_user = `user_${userId}`;
            const app_time = Date.now();
            const embed_data = JSON.stringify({
                redirecturl: `${process.env.FRONTEND_URL}/order-status/${app_trans_id}`
            });

            const items = orderItems.map(it => ({
                itemid: it.product?.toString?.() || '',
                itemname: it.name,
                itemprice: it.price,
                itemquantity: it.quantity
            }));

            const zaloOrder = {
                app_id: zaloConfig.app_id,
                app_trans_id,
                app_user,
                app_time,
                embed_data,
                item: JSON.stringify(items),
                description: `Thanh toan don hang ${app_trans_id}`,
                amount: totalAmount,
                callback_url: `${process.env.BASE_URL || ''}/api/payments/zalopay/callback`
            };

            try {
                const dataToSign = `${zaloOrder.app_id}|${zaloOrder.app_trans_id}|${zaloOrder.app_user}|${zaloOrder.amount}|${zaloOrder.app_time}|${zaloOrder.embed_data}|${zaloOrder.item}`;
                zaloOrder.mac = computeMac(dataToSign, zaloConfig.key1);

                const result = await postJson(zaloConfig.create_order_endpoint, zaloOrder);

                if (result && result.return_code === 1 && result.order_url) {
                    await sendNextOrderDiscountEmail(populatedOrder);
                    return res.status(201).json({
                        success: true,
                        message: "Đặt hàng thành công. Vui lòng thanh toán qua ZaloPay",
                        data: {
                            order: populatedOrder,
                            payment: payment[0],
                            order_url: result.order_url,
                            app_trans_id
                        }
                    });
                } else {
                    payment[0].status = 'failed';
                    payment[0].gatewayResponse = result;
                    await payment[0].save();
                }
            } catch (zaloError) {
                console.error("Lỗi gọi ZaloPay:", zaloError);
            }
        }

        await sendNextOrderDiscountEmail(populatedOrder);

        return res.status(201).json({
            success: true,
            message: "Đặt hàng thành công",
            data: {
                order: populatedOrder,
                payment: payment[0]
            }
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Lỗi khi thanh toán:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi thanh toán"
        });
    } finally {
        session.endSession();
    }
};

exports.buyNowCheckout = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const {
            productId,
            quantity = 1,
            paymentMethod = "cash",
            notes,
            shippingAddress,
            deliveryFee = 0,
            couponCode
        } = req.body;

        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }

        if (product.stock < quantity) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Sản phẩm ${product.name} không đủ số lượng (còn ${product.stock})`
            });
        }

        const unitPrice = product.price;
        const orderItems = [{
            product: product._id,
            name: product.name,
            price: unitPrice,
            quantity,
            subtotal: unitPrice * quantity
        }];

        const subtotal = unitPrice * quantity;
        const tax = 0;
        const { discountAmount, discountCode } = calculateCouponDiscount(subtotal, couponCode);
        const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount + tax);

        const order = await Order.create([{
            user: userId,
            items: orderItems,
            subtotal,
            tax,
            deliveryFee,
            discount: discountAmount,
            discountCode: discountCode || undefined,
            totalAmount,
            paymentMethod,
            paymentStatus: "pending",
            status: "pending",
            shippingAddress,
            notes
        }], { session });

        await Product.findByIdAndUpdate(
            product._id,
            { $inc: { stock: -quantity } },
            { session }
        );

        const payment = await Payment.create([{
            order: order[0]._id,
            user: userId,
            amount: totalAmount,
            method: paymentMethod,
            status: "pending"
        }], { session });

        await session.commitTransaction();

        const populatedOrder = await Order.findById(order[0]._id)
            .populate("user", "name email phone")
            .populate("items.product", "name images");

        if (paymentMethod === "zalopay") {
            const app_trans_id = generateAppTransId();

            payment[0].transactionId = app_trans_id;
            await payment[0].save();

            const app_user = `user_${userId}`;
            const app_time = Date.now();
            const embed_data = JSON.stringify({
                redirecturl: `${process.env.FRONTEND_URL}/order-status/${app_trans_id}`
            });

            const items = orderItems.map(it => ({
                itemid: it.product?.toString?.() || '',
                itemname: it.name,
                itemprice: it.price,
                itemquantity: it.quantity
            }));

            const zaloOrder = {
                app_id: zaloConfig.app_id,
                app_trans_id,
                app_user,
                app_time,
                embed_data,
                item: JSON.stringify(items),
                description: `Thanh toan don hang ${app_trans_id}`,
                amount: totalAmount,
                callback_url: `${process.env.BASE_URL || ''}/api/payments/zalopay/callback`
            };

            try {
                const dataToSign = `${zaloOrder.app_id}|${zaloOrder.app_trans_id}|${zaloOrder.app_user}|${zaloOrder.amount}|${zaloOrder.app_time}|${zaloOrder.embed_data}|${zaloOrder.item}`;
                zaloOrder.mac = computeMac(dataToSign, zaloConfig.key1);

                const result = await postJson(zaloConfig.create_order_endpoint, zaloOrder);

                if (result && result.return_code === 1 && result.order_url) {
                    await sendNextOrderDiscountEmail(populatedOrder);
                    return res.status(201).json({
                        success: true,
                        message: "Đặt hàng thành công. Vui lòng thanh toán qua ZaloPay",
                        data: {
                            order: populatedOrder,
                            payment: payment[0],
                            order_url: result.order_url,
                            app_trans_id
                        }
                    });
                } else {
                    payment[0].status = 'failed';
                    payment[0].gatewayResponse = result;
                    await payment[0].save();
                }
            } catch (zaloError) {
                console.error("Lỗi gọi ZaloPay:", zaloError);
            }
        }

        await sendNextOrderDiscountEmail(populatedOrder);

        return res.status(201).json({
            success: true,
            message: "Đặt hàng thành công",
            data: {
                order: populatedOrder,
                payment: payment[0]
            }
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Lỗi khi thanh toán mua ngay:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi thanh toán mua ngay"
        });
    } finally {
        session.endSession();
    }
};
