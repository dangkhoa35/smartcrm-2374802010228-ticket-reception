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

// EP9 – thêm thiết bị. purchase_date là YYYY-MM-DD, không được ở tương lai; để trống = chưa có ngày mua
// (khi đó QT01 coi như hết bảo hành, cần Quản lý phê duyệt lúc tạo phiếu).
const todayIso = () => new Date().toISOString().slice(0, 10);

const createDeviceSchema = z.object({
  product_name: z
    .string({ required_error: 'Vui lòng nhập tên sản phẩm', invalid_type_error: 'Tên sản phẩm phải là chữ' })
    .trim()
    .min(1, 'Vui lòng nhập tên sản phẩm')
    .max(120, 'Tên sản phẩm tối đa 120 ký tự'),
  serial_no: z
    .string({ required_error: 'Vui lòng nhập số serial', invalid_type_error: 'Số serial phải là chữ' })
    .trim()
    .min(1, 'Vui lòng nhập số serial')
    .max(50, 'Số serial tối đa 50 ký tự'),
  purchase_date: optionalText(
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày mua phải có dạng YYYY-MM-DD')
      .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Ngày mua không tồn tại')
      .refine((v) => v <= todayIso(), 'Ngày mua không được ở tương lai')),
  warranty_months: z
    .number({ required_error: 'Vui lòng nhập số tháng bảo hành', invalid_type_error: 'Số tháng bảo hành phải là số' })
    .int('Số tháng bảo hành phải là số nguyên')
    .min(0, 'Số tháng bảo hành không được âm')
    .max(120, 'Số tháng bảo hành tối đa 120'),
});

module.exports = { lookupCustomerQuerySchema, createCustomerSchema, customerIdParamSchema, createDeviceSchema };
