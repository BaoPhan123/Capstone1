const mongoose = require("mongoose");
const Order = require("../../models/Order");
const User = require("../../models/User");

exports.getAllOrders = async (req, res) => {
  try {
    const {
      q,
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

    let finalFilter = { ...filter };
    const searchText = q?.trim();
    if (searchText) {
      const searchConditions = [];

      if (mongoose.Types.ObjectId.isValid(searchText)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(searchText) });
      }

      const matchedUserIds = await User.distinct("_id", {
        $or: [
          { name: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
          { phone: { $regex: searchText, $options: "i" } }
        ]
      });

      if (matchedUserIds.length > 0) {
        searchConditions.push({ user: { $in: matchedUserIds } });
      }

      finalFilter = searchConditions.length > 0
        ? { $and: [filter, { $or: searchConditions }] }
        : { ...filter, _id: new mongoose.Types.ObjectId() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(finalFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name email phone")
        .populate("items.product", "name thumbnail price"),
      Order.countDocuments(finalFilter)
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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, shippingCode, shippingProvider } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID đơn hàng không hợp lệ" });
    }

    // Quy tắc chuyển trạng thái hợp lệ
    const VALID_TRANSITIONS = {
      confirmed: ["shipping"],
      shipping:  ["completed"],
    };

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const allowedNext = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"`
      });
    }

    // Chuyển sang Đang giao hàng
    if (status === "shipping") {
      if (!shippingCode || !shippingCode.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập mã vận chuyển" });
      }
      if (!shippingProvider || !shippingProvider.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập tên đơn vị vận chuyển" });
      }
      order.shippingCode     = shippingCode.trim();
      order.shippingProvider = shippingProvider.trim();
      order.shippingAt       = new Date();
    }

    // Chuyển sang Hoàn thành
    if (status === "completed") {
      order.completedAt = new Date();
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("items.product", "name thumbnail price");

    res.json({
      success: true,
      data: updatedOrder,
      message: "Cập nhật trạng thái đơn hàng thành công"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
