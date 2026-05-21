

const mongoose = require("mongoose");


const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    desc: { type: String },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    category: { type: String, required: true },
    description: { type: String },
    stock: { type: Number, default: 0, min: 0 },

    material: { type: String },
    dimensions: { type: String },
    color: { type: String },
    warranty: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model("Product", ProductSchema);