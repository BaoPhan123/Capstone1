const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./users.routes");
const adminRoutes = require("./admin/index");
const productRoutes = require("./product.router");
const reviewRoutes = require("./review.routes");
const newsRoutes = require("./news.routes");
const cartRoutes = require("./cart.routes");
const uploadRoutes = require("./upload.routes");
const paymentRoutes = require("./payment.routes");
const orderRoutes = require("./order.routes");
// const chatbotRoutes = require("./chatbot.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/news", newsRoutes);
router.use("/cart", cartRoutes);
router.use("/upload", uploadRoutes);
router.use("/payments", paymentRoutes);
router.use("/orders", orderRoutes);
// router.use("/chatbot", chatbotRoutes);

module.exports = router;
