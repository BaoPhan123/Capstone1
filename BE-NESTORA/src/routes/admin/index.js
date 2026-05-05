const express = require("express");
const router = express.Router();

const userRoutes = require("./users.routes");
const orderRoutes = require("./orders.routes");
const reportRoutes = require("./reports.routes");
const dashboardRoutes = require("./dashboard.routes");

router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
