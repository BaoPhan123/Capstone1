

const z = require('zod');

const isLegacyImagePath = (value) => {
    if (!value) return true;

    // Old records may store file names or relative paths instead of full URLs.
    return (
        /^\/?(uploads|images)\//i.test(value) ||
        /^[^\\/\s]+\.(jpg|jpeg|png|gif|webp)$/i.test(value)
    );
};

const imageSchema = z.string().trim().optional().or(z.literal(""))
    .refine((value) => {
        if (!value) return true;
        if (z.string().url().safeParse(value).success) return true;
        return isLegacyImagePath(value);
    }, {
        message: "Ảnh không hợp lệ"
    });

const createNewsSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    desc: z.string().min(1, "Mô tả không được để trống"),
    image: imageSchema,
    category: z.string().min(1, "Danh mục không được để trống"),
    content: z.string().min(1, "Nội dung không được để trống"),
});

const createNewsCategorySchema = z.object({
    name: z.string().trim().min(1, "Tên danh mục không được để trống"),
    slug: z.string().trim().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

const updateNewsCategorySchema = z.object({
    name: z.string().trim().min(1, "Tên danh mục không được để trống").optional(),
    slug: z.string().trim().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "Không có dữ liệu để cập nhật"
});

module.exports = {
    createNewsSchema,
    createNewsCategorySchema,
    updateNewsCategorySchema,
};