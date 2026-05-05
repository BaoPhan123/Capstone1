

const ApiRes = require("../utils/response");
const Product = require("../models/Product");
const Review = require("../models/Review");
const CATEGORIES = require("../constants/categories")

async function createProduct(req, res) {
    const doc = new Product(req.body);
    await doc.save();
    return ApiRes.success(res, { message: "Tạo sản phẩm thành công", data: doc, statusCode: 201 });
}

async function getProductById(req, res) {
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Không tìm thấy sản phẩm" });
    }

    const reviews = await Review.find({ productId: id })
        .populate('userId', 'name email phone')
        .lean();

    const reviewCount = reviews.length;

    product.reviews = reviews.map(r => ({
        _id: r._id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.userId ? {
            id: r.userId._id,
            name: r.userId.name,
            email: r.userId.email,
            phone: r.userId.phone
        } : null
    }));

    return ApiRes.success(res, { data: product });
}

async function getAllProducts(req, res) {
    const products = await Product.aggregate([
        {
            $sort: { createdAt: -1 }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                price: 1,
                desc: 1,
                description: 1,
                images: 1,
                image: { $arrayElemAt: ['$images', 0] },
                category: 1,
                stock: 1,
                sku: 1,
                material: 1,
                dimensions: 1,
                color: 1,
                warranty: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ]);
    return ApiRes.success(res, { data: products });
}

async function updateProduct(req, res) {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!updated) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Không tìm thấy sản phẩm" });
    }
    return ApiRes.success(res, { data: updated });
}

async function deleteProduct(req, res) {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Không tìm thấy sản phẩm" });
    }
    return ApiRes.success(res, { data: deleted });
}



module.exports = {
    createProduct,
    getProductById,
    getAllProducts,
    updateProduct,
    deleteProduct
};