// Kiểm tra đầu vào cho nhóm khách hàng (EP1–EP3) ở ranh giới lớp API.
const { z } = require('zod');
const { normalizePhone } = require('../utils/phone');

// Chuẩn hóa số điện thoại (QT02) ngay tại ranh giới: chấp nhận khoảng trắng, dấu chấm, 84, +84.
// Sau bước này service luôn nhận chuỗi 10 số bắt đầu bằng 0.
const phoneField = z
  .string({ required_error: 'Vui lòng nhập số điện thoại', invalid_type_error: 'Số điện thoại phải là chữ số' })
  .transform((v) => normalizePhone(v))
  .refine((v) => v !== null, { message: 'Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 0)' });

// Chuỗi rỗng coi như không nhập
const optionalText = (schema) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), schema.nullish());

const lookupCustomerQuerySchema = z.object({ phone: phoneField });

const createCustomerSchema = z.object({
  full_name: z
    .string({ required_error: 'Vui lòng nhập họ tên', invalid_type_error: 'Họ tên phải là chữ' })
    .trim()
    .min(1, 'Vui lòng nhập họ tên')
    .max(120, 'Họ tên tối đa 120 ký tự'),
  phone: phoneField,
  email: optionalText(z.string().trim().max(120, 'Email tối đa 120 ký tự').email('Email không hợp lệ')),
  address: optionalText(z.string().trim().max(255, 'Địa chỉ tối đa 255 ký tự')),
});

const customerIdParamSchema = z.object({
  customer_id: z.coerce
    .number({ invalid_type_error: 'Mã khách hàng phải là số nguyên dương' })
    .int('Mã khách hàng phải là số nguyên dương')
    .positive('Mã khách hàng phải là số nguyên dương'),
});

module.exports = { lookupCustomerQuerySchema, createCustomerSchema, customerIdParamSchema };
