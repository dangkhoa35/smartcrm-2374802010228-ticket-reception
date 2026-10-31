// Kiểm tra đầu vào cho nhóm xác thực (EP11–EP13) ở ranh giới lớp API.
const { z } = require('zod');

const ROLES = ['NHAN_VIEN_TIEP_NHAN', 'KY_THUAT_VIEN', 'QUAN_LY_TRUNG_TAM'];

const roleField = z.enum(ROLES, {
  errorMap: () => ({ message: 'Vui lòng chọn vai trò hợp lệ' }),
});

const usernameField = z
  .string({ required_error: 'Vui lòng nhập tên đăng nhập', invalid_type_error: 'Tên đăng nhập phải là chữ' })
  .trim().toLowerCase()
  .min(4, 'Tên đăng nhập tối thiểu 4 ký tự')
  .max(30, 'Tên đăng nhập tối đa 30 ký tự')
  .regex(/^[a-z0-9._]+$/, 'Chỉ dùng chữ thường không dấu, chữ số, dấu chấm và gạch dưới');

const passwordField = z
  .string({ required_error: 'Vui lòng nhập mật khẩu', invalid_type_error: 'Mật khẩu phải là chữ' })
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất một chữ cái')
  .regex(/[0-9]/, 'Mật khẩu cần có ít nhất một chữ số');

// Đăng nhập chỉ kiểm "có nhập", KHÔNG kiểm độ mạnh: không để lộ quy tắc đặt mật khẩu khi đoán
const loginSchema = z.object({
  username: z.string({ required_error: 'Vui lòng nhập tên đăng nhập' }).trim().toLowerCase().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string({ required_error: 'Vui lòng nhập mật khẩu' }).min(1, 'Vui lòng nhập mật khẩu'),
  // Không nhận vai trò: vai trò là của TÀI KHOẢN (lưu trong CSDL), người dùng không tự chọn khi đăng nhập
});

const registerSchema = z.object({
  full_name: z
    .string({ required_error: 'Vui lòng nhập họ tên', invalid_type_error: 'Họ tên phải là chữ' })
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(120, 'Họ tên tối đa 120 ký tự'),
  username: usernameField,
  password: passwordField,
  role: roleField,
  center_id: z.coerce
    .number({ invalid_type_error: 'Vui lòng chọn trung tâm bảo hành', required_error: 'Vui lòng chọn trung tâm bảo hành' })
    .int('Vui lòng chọn trung tâm bảo hành')
    .positive('Vui lòng chọn trung tâm bảo hành'),
  // Mã đăng ký: chỉ bắt buộc với vai trò Kỹ thuật viên và Quản lý (service kiểm)
  registration_code: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(64, 'Mã đăng ký tối đa 64 ký tự').optional()),
});

module.exports = { loginSchema, registerSchema, ROLES };
