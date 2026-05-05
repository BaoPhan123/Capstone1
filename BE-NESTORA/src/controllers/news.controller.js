

const ApiRes = require("../utils/response");
const News = require("../models/News");
const NewsCategory = require("../models/NewsCategory");
const { DEFAULT_NEWS_CATEGORIES } = require("../constants/newsCategories");

const normalizeSlug = (value = "") => {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

async function ensureDefaultNewsCategories() {
    const existingCount = await NewsCategory.countDocuments();
    if (existingCount > 0) {
        return;
    }

    await NewsCategory.insertMany(
        DEFAULT_NEWS_CATEGORIES.map((item) => ({
            name: item.name,
            slug: item.slug,
            order: item.order,
            isActive: true,
        }))
    );
}

async function resolveCategorySlug(inputCategory) {
    if (!inputCategory) return "";

    await ensureDefaultNewsCategories();

    const normalizedInput = String(inputCategory).trim();
    const normalizedSlug = normalizeSlug(normalizedInput);

    const matched = await NewsCategory.findOne({
        $or: [
            { slug: normalizedInput },
            { slug: normalizedSlug },
            { name: normalizedInput }
        ]
    }).lean();

    return matched?.slug || normalizedSlug || normalizedInput;
}

async function getCategoryMap() {
    const categories = await NewsCategory.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .lean();

    const bySlug = categories.reduce((acc, item) => {
        acc[item.slug] = item.name;
        return acc;
    }, {});

    const slugByName = categories.reduce((acc, item) => {
        acc[item.name.toLowerCase()] = item.slug;
        return acc;
    }, {});

    return { categories, bySlug, slugByName };
}


async function listNews(req, res) {
    const { page = 1, limit = 10, category, q } = req.query;

    await ensureDefaultNewsCategories();

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.max(Number(limit) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (category) {
        query.category = await resolveCategorySlug(category);
    }

    if (q && String(q).trim()) {
        const keyword = String(q).trim();
        query.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { desc: { $regex: keyword, $options: "i" } },
            { content: { $regex: keyword, $options: "i" } },
        ];
    }

    const [{ categories, bySlug, slugByName }, newsList, total, categoryCountsRaw] = await Promise.all([
        getCategoryMap(),
        News.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        News.countDocuments(query),
        News.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
        ])
    ]);

    const categoryCounts = categoryCountsRaw.map((item) => ({
        slug: item._id,
        name: bySlug[item._id] || item._id,
        count: item.count,
    }));

    const formattedNews = newsList.map((item) => ({
        ...item,
        category: bySlug[item.category]
            ? item.category
            : (slugByName[String(item.category || "").toLowerCase()] || item.category),
        categoryLabel: bySlug[item.category] || bySlug[slugByName[String(item.category || "").toLowerCase()]] || item.category,
    }));

    return ApiRes.send(res, {
        statusCode: 200,
        success: true,
        data: formattedNews,
        message: "Lấy danh sách bài viết thành công",
        meta: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / parsedLimit), 1),
            categories,
            categoryCounts,
        }
    });
}

async function getNewsDetail(req, res) {
    const { slug } = req.params;
    await ensureDefaultNewsCategories();

    const newsItem = await News.findOne({ slug }).populate("author", "_id name email");
    if (!newsItem) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Bài viết không tồn tại" });
    }

    const { bySlug, slugByName } = await getCategoryMap();
    const fallbackSlug = slugByName[String(newsItem.category || "").toLowerCase()];

    const payload = {
        ...newsItem.toObject(),
        category: bySlug[newsItem.category] ? newsItem.category : (fallbackSlug || newsItem.category),
        categoryLabel: bySlug[newsItem.category] || bySlug[fallbackSlug] || newsItem.category,
    };

    return ApiRes.send(res, { statusCode: 200, success: true, data: payload, message: "Lấy chi tiết bài viết thành công" });
}


async function createNews(req, res) {
    const { title, desc, image, category, content } = req.body;
    const author = req.user.id;

    const categorySlug = await resolveCategorySlug(category);
    const categoryExists = await NewsCategory.findOne({ slug: categorySlug, isActive: true });
    if (!categoryExists) {
        return ApiRes.send(res, { statusCode: 400, success: false, message: "Danh mục tin tức không hợp lệ" });
    }

    const newsItem = new News({ title, desc, image, author, category: categorySlug, content });
    await newsItem.save();
    return ApiRes.send(res, { statusCode: 201, success: true, data: newsItem, message: "Tạo bài viết thành công" });
}

async function updateNews(req, res) {
    const { slug } = req.params;
    const { title, desc, image, category, content } = req.body;
    const author = req.user.id;
    const newsItem = await News.findOne({ slug });
    if (!newsItem) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Bài viết không tồn tại" });
    }

    let nextCategorySlug = newsItem.category;
    if (category) {
        nextCategorySlug = await resolveCategorySlug(category);
        const categoryExists = await NewsCategory.findOne({ slug: nextCategorySlug, isActive: true });
        if (!categoryExists) {
            return ApiRes.send(res, { statusCode: 400, success: false, message: "Danh mục tin tức không hợp lệ" });
        }
    }

    newsItem.title = title || newsItem.title;
    newsItem.desc = desc || newsItem.desc;
    newsItem.image = image || newsItem.image;
    newsItem.author = author || newsItem.author;
    newsItem.category = nextCategorySlug;
    newsItem.content = content || newsItem.content;
    await newsItem.save();
    return ApiRes.send(res, { statusCode: 200, success: true, data: newsItem, message: "Cập nhật bài viết thành công" });
}


async function deleteNews(req, res) {
    const { slug } = req.params;
    const newsItem = await News.findOneAndDelete({ slug });
    if (!newsItem) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Bài viết không tồn tại" });
    }
    return ApiRes.send(res, { statusCode: 200, success: true, message: "Xóa bài viết thành công" });
}

async function listNewsCategories(req, res) {
    await ensureDefaultNewsCategories();

    const categories = await NewsCategory.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .lean();

    return ApiRes.send(res, {
        statusCode: 200,
        success: true,
        data: categories,
        message: "Lấy danh mục tin tức thành công",
    });
}

async function createNewsCategory(req, res) {
    await ensureDefaultNewsCategories();

    const { name, slug, order = 0, isActive = true } = req.body;
    const finalSlug = normalizeSlug(slug || name);

    if (!finalSlug) {
        return ApiRes.send(res, { statusCode: 400, success: false, message: "Slug danh mục không hợp lệ" });
    }

    const exists = await NewsCategory.findOne({ slug: finalSlug });
    if (exists) {
        return ApiRes.send(res, { statusCode: 400, success: false, message: "Danh mục đã tồn tại" });
    }

    const doc = await NewsCategory.create({ name, slug: finalSlug, order, isActive });
    return ApiRes.send(res, { statusCode: 201, success: true, data: doc, message: "Tạo danh mục tin tức thành công" });
}

async function updateNewsCategory(req, res) {
    const { id } = req.params;
    const { name, slug, order, isActive } = req.body;

    const category = await NewsCategory.findById(id);
    if (!category) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Không tìm thấy danh mục" });
    }

    if (slug || name) {
        const nextSlug = normalizeSlug(slug || name || category.name);
        const duplicate = await NewsCategory.findOne({ _id: { $ne: id }, slug: nextSlug });
        if (duplicate) {
            return ApiRes.send(res, { statusCode: 400, success: false, message: "Slug danh mục đã tồn tại" });
        }

        if (nextSlug !== category.slug) {
            await News.updateMany({ category: category.slug }, { $set: { category: nextSlug } });
        }

        category.slug = nextSlug;
    }

    if (name !== undefined) category.name = name;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    return ApiRes.send(res, { statusCode: 200, success: true, data: category, message: "Cập nhật danh mục tin tức thành công" });
}

async function deleteNewsCategory(req, res) {
    const { id } = req.params;

    const category = await NewsCategory.findById(id);
    if (!category) {
        return ApiRes.send(res, { statusCode: 404, success: false, message: "Không tìm thấy danh mục" });
    }

    const usedCount = await News.countDocuments({ category: category.slug });
    if (usedCount > 0) {
        return ApiRes.send(res, {
            statusCode: 400,
            success: false,
            message: "Danh mục đang có bài viết, không thể xóa"
        });
    }

    await NewsCategory.findByIdAndDelete(id);
    return ApiRes.send(res, { statusCode: 200, success: true, message: "Xóa danh mục tin tức thành công" });
}

module.exports = {
    listNews,
    getNewsDetail,
    createNews,
    updateNews,
    deleteNews,
    listNewsCategories,
    createNewsCategory,
    updateNewsCategory,
    deleteNewsCategory,
};


