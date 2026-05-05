const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const adminReportController = require("../../controllers/admin/adminReportController");

router.get("/revenue", auth(["admin"]), adminReportController.getRevenueReports);
router.get("/orders", auth(["admin"]), adminReportController.getOrderStatistics);

module.exports = router;
