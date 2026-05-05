const mongoose = require("mongoose");

const UserPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  favoriteCategories: [{ type: String }],
  favoriteDishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  dietaryRestrictions: [{ type: String }], // vegetarian, gluten-free, dairy-free, etc.
  allergies: [{ type: String }],
  spiceLevel: { type: String, enum: ["mild", "medium", "hot", "extra_hot"], default: "medium" },
  budgetRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 1000000 }
  },
  healthGoals: [{ type: String }], // weight_loss, muscle_gain, balanced_diet, etc.
  preferredMealTimes: {
    breakfast: { type: String }, // time range
    lunch: { type: String },
    dinner: { type: String }
  },
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    recommendations: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model("UserPreference", UserPreferenceSchema);
