const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { validateBody } = require("../middlewares/validateBody");
const userController = require("../controllers/userController");
const {
  updateProfileSchema,
  changePasswordSchema
} = require("../validators/user.validator");

router.get("/profile", auth(), userController.getProfile);

router.patch(
  "/profile",
  auth(),
  validateBody(updateProfileSchema),
  userController.updateProfile
);

router.post(
  "/change-password",
  auth(),
  validateBody(changePasswordSchema),
  userController.changePassword
);

router.get("/stats", auth(), userController.getAccountStats);

router.get("/preferences", auth(), userController.getPreferences);
router.post("/favorites", auth(), userController.addFavoriteDish);
router.delete("/favorites/:dishId", auth(), userController.removeFavoriteDish);

module.exports = router;
