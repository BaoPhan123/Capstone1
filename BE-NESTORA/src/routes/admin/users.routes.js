const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const { validateBody } = require("../../middlewares/validateBody");
const adminUserController = require("../../controllers/admin/adminUserController");
const {
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
  bulkUpdateStatusSchema,
  getUserDetailSchema
} = require("../../validators/admin/user.validator");

router.get("/", auth(["admin"]), adminUserController.getAllUsers);
router.post("/detail", auth(["admin"]), validateBody(getUserDetailSchema), adminUserController.getUserById);
router.put("/:id", auth(["admin"]), validateBody(updateUserSchema), adminUserController.updateUser);
router.delete("/:id", auth(["admin"]), adminUserController.deleteUser);
router.delete("/:id/permanent", auth(["admin"]), adminUserController.permanentDeleteUser);
router.post("/orders", auth(["admin"]), adminUserController.getUserOrders);
router.put("/status", auth(["admin"]), validateBody(updateUserStatusSchema), adminUserController.updateUserStatus);
router.put("/roles", auth(["admin"]), validateBody(updateUserRolesSchema), adminUserController.updateUserRoles);
router.get("/statistics", auth(["admin"]), adminUserController.getUserStatistics);
router.put("/bulk-status", auth(["admin"]), validateBody(bulkUpdateStatusSchema), adminUserController.bulkUpdateUserStatus);
router.get("/export", auth(["admin"]), adminUserController.exportUsers);

module.exports = router;
