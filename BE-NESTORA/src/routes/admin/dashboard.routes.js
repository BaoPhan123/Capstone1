const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const adminDashboardController = require("../../controllers/admin/adminDashboardController");

router.get("/", auth(["admin"]), adminDashboardController.getDashboardOverview);
router.get("/stats", auth(["admin"]), adminDashboardController.getDashboardStats);

module.exports = router;
