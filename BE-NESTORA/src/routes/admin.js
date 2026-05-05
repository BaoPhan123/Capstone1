const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const validateBody = require("../middlewares/validateBody");
const adminController = require("../controllers/adminController");
const {
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
  bulkUpdateStatusSchema,
  getUserDetailSchema
} = require("../validators/admin.validator");

// User management
router.get("/users", auth(["admin"]), adminController.getAllUsers);
router.post("/users/detail", auth(["admin"]), validateBody(getUserDetailSchema), adminController.getUserById);
router.put("/users/:id", auth(["admin"]), validateBody(updateUserSchema), adminController.updateUser);
router.delete("/users/:id", auth(["admin"]), adminController.deleteUser);
router.delete("/users/:id/permanent", auth(["admin"]), adminController.permanentDeleteUser);
router.post("/users/orders", auth(["admin"]), adminController.getUserOrders);
router.put("/users/status", auth(["admin"]), validateBody(updateUserStatusSchema), adminController.updateUserStatus);
router.put("/users/roles", auth(["admin"]), validateBody(updateUserRolesSchema), adminController.updateUserRoles);
router.get("/users/statistics", auth(["admin"]), adminController.getUserStatistics);
router.put("/users/bulk-status", auth(["admin"]), validateBody(bulkUpdateStatusSchema), adminController.bulkUpdateUserStatus);
router.get("/users/export", auth(["admin"]), adminController.exportUsers);

// Orders overview
router.get("/orders", auth(["admin"]), adminController.getAllOrders);
router.get("/orders/:orderId", auth(["admin"]), adminController.getOrderById);
router.patch("/orders/:orderId/status", auth(["admin"]), adminController.updateOrderStatus);

// Reports and statistics
router.get("/reports/revenue", auth(["admin"]), adminController.getRevenueReports);
router.get("/reports/orders", auth(["admin"]), adminController.getOrderStatistics);
router.get("/dashboard", auth(["admin"]), adminController.getDashboardOverview);

module.exports = router;
