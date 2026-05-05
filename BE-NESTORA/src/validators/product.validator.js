

const z = require("zod");
const CATEGORIES = require("../constants/categories");

const createProductSchema = z.object({
    name: z.string().min(1, "Tên sản phẩm không được để trống"),
    desc: z.string().optional(),
    price: z.number().min(0, "Giá sản phẩm phải lớn hơn hoặc bằng 0"),
    images: z.array(z.string().url("Mỗi hình ảnh phải là một URL hợp lệ")).optional(),
    category: z.string().refine((val) => Object.values(CATEGORIES).some(cat => cat.slug === val), {
        message: "Danh mục không hợp lệ"
    }),
    description: z.string().optional(),
    stock: z.number().int().min(0, "Tồn kho phải >= 0").optional(),
    sku: z.string().optional(),
    material: z.string().optional(),
    dimensions: z.string().optional(),
    color: z.string().optional(),
    warranty: z.string().optional(),
});


module.exports = {
    createProductSchema
};