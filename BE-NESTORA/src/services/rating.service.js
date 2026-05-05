const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

async function recomputeProductRating(productId) {
  try {
    const objectId = new mongoose.Types.ObjectId(String(productId));

    const agg = await Review.aggregate([
      { $match: { productId: objectId } },
      {
        $group: {
          _id: "$productId",
          avg: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    const avg = agg.length ? Number(agg[0].avg.toFixed(2)) : 0;
    const count = agg.length ? agg[0].count : 0;

    await Product.findByIdAndUpdate(
      objectId,
      { $set: { rate: avg, rateCount: count } },
      { new: true }
    );

    console.log(`✅ Updated rating for Product ${productId}: ${avg} (${count} reviews)`);
  } catch (err) {
    console.error("❌ recomputeProductRating error:", err.message);
  }
}

module.exports = { recomputeProductRating };