const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbot.controller");

// Chat endpoints
router.post("/send", chatbotController.sendMessage);
router.post("/reset", chatbotController.resetSession);
router.get("/history", chatbotController.getChatHistory);

// Product endpoints
router.post("/search", chatbotController.searchProducts);
router.get("/product/:productId", chatbotController.getProductDetails);

// Order endpoints
router.post("/orders", chatbotController.checkOrderStatus);

module.exports = router;
