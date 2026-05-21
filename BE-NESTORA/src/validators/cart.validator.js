const { z } = require("zod");

const mongoIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID khong hop le");

const positiveInt = z.preprocess(
  (val) => typeof val === "string" ? parseInt(val, 10) : val,
  z.number().int().min(1, "So luong phai la so nguyen duong lon hon 0")
);

const money = (message) => z.preprocess(
  (val) => typeof val === "string" ? parseFloat(val) : val,
  z.number().min(0, message).optional().default(0)
);

const paymentMethod = z.enum(["cash", "card", "momo", "zalopay", "banking"], {
  errorMap: () => ({ message: "Phuong thuc thanh toan khong hop le" })
}).default("cash");

const couponCode = z.string().trim().max(30, "Ma giam gia khong hop le").optional();

const addToCartSchema = z.object({
  productId: mongoIdString.min(1, "ID san pham khong duoc de trong"),
  quantity: positiveInt
});

const updateCartItemSchema = z.object({
  cartItemId: mongoIdString.min(1, "ID san pham trong gio hang khong duoc de trong"),
  quantity: positiveInt
});

const checkoutSchema = z.object({
  paymentMethod,
  shippingAddress: z.string().min(1, "Dia chi giao hang khong duoc de trong"),
  notes: z.string().optional(),
  deliveryFee: money("Phi giao hang phai >= 0"),
  discount: money("Giam gia phai >= 0"),
  couponCode
});

const buyNowCheckoutSchema = z.object({
  productId: mongoIdString.min(1, "ID san pham khong duoc de trong"),
  quantity: positiveInt.default(1),
  paymentMethod,
  shippingAddress: z.string().min(1, "Dia chi giao hang khong duoc de trong"),
  notes: z.string().optional(),
  deliveryFee: money("Phi giao hang phai >= 0"),
  discount: money("Giam gia phai >= 0"),
  couponCode
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  checkoutSchema,
  buyNowCheckoutSchema
};
