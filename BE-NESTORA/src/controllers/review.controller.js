const mongoose = require("mongoose");
const Review = require("../models/Review");
const User = require("../models/User");
const Order = require("../models/Order");
const { recomputeProductRating } = require("../services/rating.service");

const ApiRes = require("../utils/response");

async function getReviewStatus(req, res) {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId))
    return ApiRes.send(res, { statusCode: 400, success: false, message: "productId kh\u00f4ng h\u1ee3p l\u1ec7" });

  const userId = req.user?.id;

  const [hasPurchased, existingReview] = await Promise.all([
    Order.exists({
      user: userId,
      "items.product": productId,
      status: { $in: ["completed", "confirmed"] }
    }),
    Review.findOne({ productId, userId }).populate("userId", "name email")
  ]);

  return ApiRes.success(res, {
    data: {
      hasPurchased: !!hasPurchased,
      hasReviewed: !!existingReview,
      myReview: existingReview || null
    }
  });
}

async function listReviews(req, res) {

  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId))
    return ApiRes.send(res, { statusCode: 400, success: false, message: "productId không hợp lệ" });

  const reviews = await Review.find({ productId })
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });

  return ApiRes.success(res, { total: reviews.length, data: reviews });
}

async function createReview(req, res) {

  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId))
    return ApiRes.send(res, { statusCode: 400, success: false, message: "productId không hợp lệ" });

  const userId = req.user?.id;

  const { rating, comment, images } = req.body;

  if (!await Order.exists({ user: userId, "items.product": productId, status: { $in: ["completed", "confirmed"] } })) {
    return ApiRes.send(res, { statusCode: 403, success: false, message: "Bạn cần mua sản phẩm này trước khi đánh giá" });
  }

  let review = await Review.findOne({ productId, userId });
  if (review) {
    return ApiRes.send(res, { statusCode: 409, success: false, message: "B\u1ea1n \u0111\u00e3 \u0111\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m n\u00e0y r\u1ed3i" });
  }

  review = await Review.create({ productId, userId, rating, comment, images });
  await recomputeProductRating(productId);
  review = await Review.findById(review._id).populate("userId", "name email phone");

  return ApiRes.success(res, { message: "Đánh giá thành công", data: review });

}

async function updateReview(req, res) {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId))
      return res.status(400).json({ message: "productId không hợp lệ" });

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    const review = await Review.findOne({ productId, userId });
    if (!review) return res.status(404).json({ message: "Không tìm thấy review" });

    // Update only allowed fields
    const { rating, comment, images } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();
    await recomputeProductRating(review.productId);

    // Populate user info before returning
    const updatedReview = await Review.findById(review._id).populate("userId", "name email phone");

    res.json({ message: "Cập nhật review thành công", data: updatedReview });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
}

async function deleteReview(req, res) {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId))
      return res.status(400).json({ message: "productId không hợp lệ" });

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    const doc = await Review.findOneAndDelete({ productId, userId });
    if (!doc) return res.status(404).json({ message: "Không tìm thấy review" });

    // Recompute rating after delete - use productId from params to be safe
    await recomputeProductRating(productId);

    res.json({ message: "Đã xoá review", data: doc._id });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviewStatus
};
