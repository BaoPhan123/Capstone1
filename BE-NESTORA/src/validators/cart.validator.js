const { z } = require("zod");

const mongoIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

const addToCartSchema = z.object({
    productId: mongoIdString.min(1, "ID sản phẩm không được để trống"),
    quantity: z.preprocess(
        (val) => typeof val === 'string' ? parseInt(val, 10) : val,
        z.number().int().min(1, "Số lượng phải là số nguyên dương lớn hơn 0")
    )
});

const updateCartItemSchema = z.object({
    cartItemId: mongoIdString.min(1, "ID sản phẩm trong giỏ hàng không được để trống"),
    quantity: z.preprocess(
        (val) => typeof val === 'string' ? parseInt(val, 10) : val,
        z.number().int().min(1, "Số lượng phải là số nguyên dương lớn hơn 0")
    )
});

const checkoutSchema = z.object({
    paymentMethod: z.enum(["cash", "card", "momo", "zalopay", "banking"], {
        errorMap: () => ({ message: "Phương thức thanh toán không hợp lệ" })
    }).default("cash"),
    shippingAddress: z.string().min(1, "Địa chỉ giao hàng không được để trống"),
    notes: z.string().optional(),
    deliveryFee: z.preprocess(
        (val) => typeof val === 'string' ? parseFloat(val) : val,
        z.number().min(0, "Phí giao hàng phải >= 0").optional().default(0)
    ),
    discount: z.preprocess(
        (val) => typeof val === 'string' ? parseFloat(val) : val,
        z.number().min(0, "Giảm giá phải >= 0").optional().default(0)
    )
});

const buyNowCheckoutSchema = z.object({
    productId: mongoIdString.min(1, "ID sản phẩm không được để trống"),
    quantity: z.preprocess(
        (val) => typeof val === 'string' ? parseInt(val, 10) : val,
        z.number().int().min(1, "Số lượng phải là số nguyên dương lớn hơn 0")
    ).default(1),
    paymentMethod: z.enum(["cash", "card", "momo", "zalopay", "banking"], {
        errorMap: () => ({ message: "Phương thức thanh toán không hợp lệ" })
    }).default("cash"),
    shippingAddress: z.string().min(1, "Địa chỉ giao hàng không được để trống"),
    notes: z.string().optional(),
    deliveryFee: z.preprocess(
        (val) => typeof val === 'string' ? parseFloat(val) : val,
        z.number().min(0, "Phí giao hàng phải >= 0").optional().default(0)
    ),
    discount: z.preprocess(
        (val) => typeof val === 'string' ? parseFloat(val) : val,
        z.number().min(0, "Giảm giá phải >= 0").optional().default(0)
    )
});

module.exports = {
    addToCartSchema,
    updateCartItemSchema,
    checkoutSchema,
    buyNowCheckoutSchema
};
