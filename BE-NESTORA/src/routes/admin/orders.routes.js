const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const { validateBody } = require("../../middlewares/validateBody");
const adminOrderController = require("../../controllers/admin/adminOrderController");
const { updateOrderStatusSchema } = require("../../validators/order.validator");

router.get("/", auth(["admin"]), adminOrderController.getAllOrders);
router.patch("/:id/status", auth(["admin"]), validateBody(updateOrderStatusSchema), adminOrderController.updateOrderStatus);

module.exports = router;
