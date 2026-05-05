const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  rating: { type: Number, required: true, min: 0, max: 5 },
  comment: { type: String, default: "", trim: true },
  images: [{ type: String, default: [] }]
}, { timestamps: true });

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); // 1 user chỉ review 1 lần cho 1 product

const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;