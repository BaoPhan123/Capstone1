const { z } = require("zod");

const updateUserSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .trim()
    .toLowerCase()
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{8,15}$/, "Số điện thoại phải gồm 8-15 chữ số")
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .optional(),
  roles: z
    .array(z.enum(["customer", "admin"]))
    .optional(),
  status: z
    .enum(["active", "blocked"])
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "Cần cung cấp ít nhất một trường để cập nhật"
});

const updateUserStatusSchema = z.object({
  id: z
    .string()
    .min(1, "ID người dùng không được để trống"),
  status: z
    .enum(["active", "blocked"], {
      errorMap: () => ({ message: "Trạng thái phải là 'active' hoặc 'blocked'" })
    })
});

const updateUserRolesSchema = z.object({
  id: z
    .string()
    .min(1, "ID người dùng không được để trống"),
  roles: z
    .array(z.enum(["customer", "admin"]))
    .min(1, "Phải có ít nhất một vai trò")
});

const bulkUpdateStatusSchema = z.object({
  userIds: z
    .array(z.string())
    .min(1, "Danh sách userIds không được rỗng"),
  status: z
    .enum(["active", "blocked"], {
      errorMap: () => ({ message: "Trạng thái phải là 'active' hoặc 'blocked'" })
    })
});

const getUserDetailSchema = z.object({
  id: z
    .string()
    .min(1, "ID người dùng không được để trống")
});

module.exports = {
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
  bulkUpdateStatusSchema,
  getUserDetailSchema
};
