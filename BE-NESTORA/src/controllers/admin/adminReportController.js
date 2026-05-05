const Order = require("../../models/Order");
const Review = require("../../models/Review");

exports.getRevenueReports = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const matchFilter = {
      status: "completed",
      paymentStatus: "paid"
    };

    if (startDate || endDate) {
      matchFilter.completedAt = {};
      if (startDate) matchFilter.completedAt.$gte = new Date(startDate);
      if (endDate) matchFilter.completedAt.$lte = new Date(endDate);
    }

    const revenueData = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === "month" ? "%Y-%m" : "%Y-%m-%d",
              date: "$completedAt"
            }
          },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalRevenue = revenueData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalOrders = revenueData.reduce((sum, day) => sum + day.orderCount, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        breakdown: revenueData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const statusDistribution = await Order.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const paymentMethodDistribution = await Order.aggregate([
      { $match: { ...matchFilter, paymentStatus: "paid" } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { ...matchFilter, status: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    const customerStats = await Order.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$totalAmount" } } },
      { $group: { _id: null, totalCustomers: { $sum: 1 }, avgOrdersPerCustomer: { $avg: "$orderCount" } } }
    ]);

    res.json({
      success: true,
      data: {
        statusDistribution,
        paymentMethodDistribution,
        topProducts,
        customerStats: customerStats[0] || { totalCustomers: 0, avgOrdersPerCustomer: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
