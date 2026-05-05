const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const auth = require("../middlewares/auth");
const { validateBody } = require("../middlewares/validateBody");
const { addToCartSchema, updateCartItemSchema, checkoutSchema, buyNowCheckoutSchema } = require("../validators/cart.validator");

router.get("/my-cart", auth(["customer"]), cartController.getCart);
router.post("/add-to-cart", auth(["customer"]), validateBody(addToCartSchema), cartController.addToCart);
router.put("/update-cart-item", auth(["customer"]), validateBody(updateCartItemSchema), cartController.updateCartItem);
router.delete("/remove-from-cart/:cartItemId", auth(["customer"]), cartController.removeFromCart);
router.delete("/clear-cart", auth(["customer"]), cartController.clearCart);
router.post("/checkout", auth(["customer"]), validateBody(checkoutSchema), cartController.checkout);
router.post("/buy-now-checkout", auth(["customer"]), validateBody(buyNowCheckoutSchema), cartController.buyNowCheckout);

module.exports = router;
