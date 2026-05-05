const mongoose = require("mongoose");

const NewsCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true
    }
);

NewsCategorySchema.index({ slug: 1 }, { unique: true });
NewsCategorySchema.index({ isActive: 1, order: 1, name: 1 });

module.exports = mongoose.model("NewsCategory", NewsCategorySchema);
