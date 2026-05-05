const { z } = require("zod");

// helper: nhận Date hoặc ISO string -> Date
const asDate = (field) =>
  z.preprocess(
    (v) => (typeof v === "string" || v instanceof Date) ? new Date(v) : v,
    z.date()
  );

const NutrientSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.string().optional().default("")
});

// ==== CREATE (đang có) ====
const createMenuItemSchema = z.object({
  name: z.string().min(1).trim(),
  description: z.string().min(1).trim(),
  category: z.string().min(1).trim(),

  thumbnail: z.string().min(1),
  images: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  type: z.string().min(1),

  isAvailable: z.boolean().optional().default(true),

  preparationTime: z.string().optional().default(""),
  portion: z.string().optional().default(""),

  ingredients: z.array(z.string()).optional().default([]),
  nutritionalInformation: z.array(NutrientSchema).optional().default([]),

  rate: z.number().min(0).max(5).optional().default(0),
  rateCount: z.number().min(0).optional().default(0),

  price: z.number().min(0),
  discountPrice: z.number().min(0).nullable().optional().default(null),
  discountStartAt: asDate("discountStartAt").nullable().optional().default(null),
  discountEndAt: asDate("discountEndAt").nullable().optional().default(null),
})
.refine((d) => d.discountPrice == null || d.discountPrice <= d.price, {
  message: "discountPrice phải nhỏ hơn hoặc bằng price",
  path: ["discountPrice"]
})
.refine((d) => !(d.discountStartAt && d.discountEndAt) || d.discountStartAt <= d.discountEndAt, {
  message: "discountStartAt phải trước hoặc bằng discountEndAt",
  path: ["discountStartAt"]
});

// ==== UPDATE (mới thêm) ====
// Cho phép partial update, nhưng vẫn giữ rule: nếu có cả discountPrice & price thì discountPrice <= price,
// và nếu có cả discountStartAt & discountEndAt thì start <= end.
const updateMenuItemSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().min(1).trim().optional(),
  category: z.string().min(1).trim().optional(),

  thumbnail: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  type: z.string().min(1).optional(),

  isAvailable: z.boolean().optional(),

  preparationTime: z.string().optional(),
  portion: z.string().optional(),

  ingredients: z.array(z.string()).optional(),
  nutritionalInformation: z.array(NutrientSchema).optional(),

  rate: z.number().min(0).max(5).optional(),
  rateCount: z.number().min(0).optional(),

  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).nullable().optional(),
  discountStartAt: asDate("discountStartAt").nullable().optional(),
  discountEndAt: asDate("discountEndAt").nullable().optional(),
})
.refine((d) => {
  if (d.discountPrice == null || d.price == null) return true;
  return d.discountPrice <= d.price;
}, {
  message: "discountPrice phải nhỏ hơn hoặc bằng price",
  path: ["discountPrice"]
})
.refine((d) => {
  if (!d.discountStartAt || !d.discountEndAt) return true;
  return d.discountStartAt <= d.discountEndAt;
}, {
  message: "discountStartAt phải trước hoặc bằng discountEndAt",
  path: ["discountStartAt"]
});

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema
};