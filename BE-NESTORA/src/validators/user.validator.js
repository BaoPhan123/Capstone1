const { z } = require("zod");

const updateProfileSchema = z.object({
  avatar: z.string().url("Avatar phải là một URL hợp lệ").optional(),
  name: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{8,15}$/, "Số điện thoại phải gồm 8-15 chữ số")
    .optional(),
  address: z
    .string()
    .trim()
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "Cần cung cấp ít nhất một trường để cập nhật",
  path: ["name"]
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
    .regex(/[A-Za-z]/, "Mật khẩu mới phải chứa chữ cái")
    .regex(/[0-9]/, "Mật khẩu mới phải chứa chữ số")
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "Mật khẩu mới phải khác mật khẩu hiện tại",
  path: ["newPassword"]
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema
};

