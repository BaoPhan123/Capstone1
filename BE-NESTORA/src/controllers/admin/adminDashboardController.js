const User = require("../../models/User");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Review = require("../../models/Review");

exports.getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      todayOrders,
      completedOrders,
      totalRevenue,
      pendingOrders,
      averageRating
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({
        $or: [
          { paymentStatus: "paid" },
          { status: { $in: ["confirmed", "preparing", "ready", "delivering", "completed"] } }
        ]
      }),
      Order.aggregate([
        {
          $match: {
            status: { $in: ["confirmed", "preparing", "ready", "delivering", "completed"] }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.countDocuments({ status: "pending" }),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: "$rating" } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        todayOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        averageRating: averageRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Comprehensive dashboard stats endpoint
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const paidStatuses = ["confirmed", "preparing", "ready", "delivering", "completed"];

    // ===== 1. KPIs with comparison =====
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenueAgg,
      prevMonthRevenueAgg,
      currentMonthOrders,
      prevMonthOrders,
      currentMonthUsers,
      prevMonthUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      // Total revenue
      Order.aggregate([
        { $match: { status: { $in: paidStatuses } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      // Previous month revenue
      Order.aggregate([
        { $match: { status: { $in: paidStatuses }, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      // Current month orders
      Order.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      // Previous month orders
      Order.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
      // Current month users
      User.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      // Previous month users
      User.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const prevRevenue = prevMonthRevenueAgg[0]?.total || 0;

    // ===== 2. Monthly revenue chart (last 12 months) =====
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: { $in: paidStatuses }, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing months
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = monthlyRevenue.find(m => m._id === key);
      revenueByMonth.push({
        month: `T${d.getMonth() + 1}`,
        monthKey: key,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0
      });
    }

    // ===== 3. Category distribution =====
    const categoryDistribution = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const totalProductsForCategory = categoryDistribution.reduce((s, c) => s + c.count, 0);
    const categoryData = categoryDistribution.map((c, i) => {
      const colors = ['#bd945f', '#2c2e53', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      return {
        name: c._id,
        value: totalProductsForCategory > 0 ? Math.round((c.count / totalProductsForCategory) * 100) : 0,
        count: c.count,
        color: colors[i % colors.length]
      };
    });

    // ===== 4. Recent orders =====
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("items.product", "name");

    const formattedOrders = recentOrders.map(order => ({
      id: order._id,
      customer: order.user?.name || "Không rõ",
      product: order.items.map(i => i.name || i.product?.name).join(", "),
      amount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      date: order.createdAt
    }));

    // ===== 5. Top products =====
    const topProducts = await Order.aggregate([
      { $match: { status: { $in: paidStatuses } } },
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
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $project: {
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          image: { $arrayElemAt: [{ $arrayElemAt: ["$productInfo.images", 0] }, 0] }
        }
      }
    ]);

    // ===== 6. Order status distribution =====
    const statusDistribution = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Calculate percentage changes
    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    // Current month revenue
    const currentMonthRevenueAgg = await Order.aggregate([
      { $match: { status: { $in: paidStatuses }, createdAt: { $gte: currentMonthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const currentMonthRevenue = currentMonthRevenueAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          totalUsers,
          totalProducts,
          pendingOrders,
          revenueChange: calcChange(currentMonthRevenue, prevRevenue),
          ordersChange: calcChange(currentMonthOrders, prevMonthOrders),
          usersChange: calcChange(currentMonthUsers, prevMonthUsers),
        },
        revenueByMonth,
        categoryData,
        recentOrders: formattedOrders,
        topProducts,
        statusDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
