const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Review = require("../models/Review");
const UserPreference = require("../models/UserPreference");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (role) filter.roles = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user by id with statistics
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const [orderSummary, preferences] = await Promise.all([
      Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
              }
            },
            totalSpent: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["completed", "delivering", "ready", "preparing", "confirmed"]] },
                  "$totalAmount",
                  0
                ]
              }
            }
          }
        }
      ]),
      UserPreference.findOne({ user: id })
        .populate("favoriteDishes", "name thumbnail price")
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: orderSummary[0] || { totalOrders: 0, completedOrders: 0, totalSpent: 0 },
        preferences: preferences || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { id, status, paymentStatus, page = 1, limit = 20 } = { ...req.body, ...req.query };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    const filter = { user: id };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("items.product", "name thumbnail price"),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders (admin overview)
exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      user,
      method,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (user && mongoose.Types.ObjectId.isValid(user)) {
      filter.user = user;
    }
    if (method) filter.paymentMethod = method;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name email phone")
        .populate("items.product", "name thumbnail price"),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, shippingCode, shippingProvider } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "ID đơn hàng không hợp lệ" });
    }

    const VALID_TRANSITIONS = {
      confirmed: ["shipping", "cancelled"],
      shipping: ["completed"],
    };

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[order.status];
    if (!allowedNext || !allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"`
      });
    }

    // Validate shipping info when moving to shipping
    if (status === "shipping") {
      if (!shippingCode || !shippingCode.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập mã vận chuyển" });
      }
      if (!shippingProvider || !shippingProvider.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập tên đơn vị vận chuyển" });
      }
      order.shippingCode = shippingCode.trim();
      order.shippingProvider = shippingProvider.trim();
      order.shippingAt = new Date();
    }

    if (status === "completed") {
      order.completedAt = new Date();
    }

    order.status = status;
    await order.save();

    return res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order detail (admin)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "ID đơn hàng không hợp lệ" });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name thumbnail price");

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update user roles
exports.updateUserRoles = async (req, res) => {
  try {
    const { id, roles } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { roles },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update user info by admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, name, address, roles, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (name) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (roles) updateData.roles = roles;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thông tin nào để cập nhật"
      });
    }

    if (email || phone) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        $or: [
          email ? { email } : null,
          phone ? { phone } : null
        ].filter(Boolean)
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email ? "Email đã tồn tại" : "Số điện thoại đã tồn tại"
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      data: user,
      message: "Cập nhật thông tin người dùng thành công"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete user (soft delete by blocking)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Không thể xóa tài khoản admin"
      });
    }

    await User.findByIdAndUpdate(id, { status: "blocked" });

    res.json({
      success: true,
      message: "Đã khóa tài khoản người dùng"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Hard delete user
exports.permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Không thể xóa tài khoản admin"
      });
    }

    const hasOrders = await Order.exists({ user: id });
    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa người dùng có đơn hàng. Vui lòng chỉ khóa tài khoản."
      });
    }

    await Promise.all([
      User.findByIdAndDelete(id),
      UserPreference.deleteMany({ user: id }),
      Review.deleteMany({ user: id })
    ]);

    res.json({
      success: true,
      message: "Đã xóa vĩnh viễn người dùng và dữ liệu liên quan"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      adminUsers,
      usersByRole,
      newUsersCount,
      topSpenders
    ] = await Promise.all([
      User.countDocuments(matchFilter),
      User.countDocuments({ ...matchFilter, status: "active" }),
      User.countDocuments({ ...matchFilter, status: "blocked" }),
      User.countDocuments({ ...matchFilter, roles: "admin" }),
      User.aggregate([
        { $match: matchFilter },
        { $unwind: "$roles" },
        { $group: { _id: "$roles", count: { $sum: 1 } } }
      ]),
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }),
      Order.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        { $unwind: "$userInfo" },
        {
          $project: {
            _id: 1,
            name: "$userInfo.name",
            email: "$userInfo.email",
            totalSpent: 1,
            orderCount: 1
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          blockedUsers,
          adminUsers,
          newUsersLast30Days: newUsersCount
        },
        usersByRole,
        topSpenders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk update user status
exports.bulkUpdateUserStatus = async (req, res) => {
  try {
    const { userIds, status } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách userIds phải là mảng và không được rỗng"
      });
    }

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái phải là 'active' hoặc 'blocked'"
      });
    }

    const validIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có ID hợp lệ nào"
      });
    }

    const result = await User.updateMany(
      {
        _id: { $in: validIds },
        roles: { $ne: "admin" }
      },
      { status }
    );

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái ${result.modifiedCount} người dùng`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Export users to CSV data
exports.exportUsers = async (req, res) => {
  try {
    const { status, role } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (role) filter.roles = role;

    const users = await User.find(filter)
      .select("name email phone roles status createdAt")
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [orderCount, totalSpent] = await Promise.all([
          Order.countDocuments({ user: user._id }),
          Order.aggregate([
            {
              $match: {
                user: user._id,
                status: "completed"
              }
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ])
        ]);

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles: user.roles.join(", "),
          status: user.status,
          orderCount,
          totalSpent: totalSpent[0]?.total || 0,
          createdAt: user.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get revenue reports
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

    // Aggregate revenue data
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

    // Calculate totals
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

// Get order statistics
exports.getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    // Get order status distribution
    const statusDistribution = await Order.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Get payment method distribution
    const paymentMethodDistribution = await Order.aggregate([
      { $match: { ...matchFilter, paymentStatus: "paid" } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
    ]);

    // Get top selling products
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

    // Get customer statistics
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

// Get dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDishes,
      totalOrders,
      todayOrders,
      completedOrders,
      totalRevenue,
      pendingOrders,
      averageRating
    ] = await Promise.all([
      User.countDocuments(),
      Dish.countDocuments(),
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
        totalDishes,
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
