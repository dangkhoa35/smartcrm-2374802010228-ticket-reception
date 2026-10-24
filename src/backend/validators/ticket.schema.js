// ============================================================================
// Kiểm tra dữ liệu ĐẦU VÀO ở ranh giới (lớp API). Service nhận dữ liệu đã sạch.
// Schema chính là hợp đồng viết bằng mã: vừa là tài liệu, vừa được thi hành.
// Thông báo lỗi viết cho NGƯỜI DÙNG, tiếng Việt có dấu.
// Lỗi -> AppError 400 DU_LIEU_KHONG_HOP_LE kèm `fields` { ten_truong: thông báo }.
// ============================================================================
const { z } = require('zod');
const AppError = require('../utils/AppError');

const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const STATUSES = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY'];
const ACCESSORIES = ['SAC', 'TAI_NGHE', 'HOP', 'KHAC'];

const posInt = (msg) =>
  z.number({ required_error: msg, invalid_type_error: msg }).int(msg).positive(msg);
const optionalPosInt = (msg) => posInt(msg).nullish();

const createTicketSchema = z.object({
  customer_id: posInt('Chưa chọn khách hàng'),
  device_id: posInt('Chưa chọn thiết bị'),
  issue_desc: z
    .string({ required_error: 'Vui lòng mô tả lỗi', invalid_type_error: 'Mô tả lỗi phải là chữ' })
    .trim()
    .min(10, 'Mô tả lỗi cần tối thiểu 10 ký tự')
    .max(2000, 'Mô tả lỗi tối đa 2000 ký tự'),
  priority: z.enum(PRIORITIES, { errorMap: () => ({ message: `Mức ưu tiên phải thuộc ${PRIORITIES.join(', ')}` }) }).nullish(),
  category_id: optionalPosInt('Nhóm sự cố không hợp lệ'),
  approved_by: optionalPosInt('Mã người phê duyệt không hợp lệ'),
  accessories: z
    .array(z.enum(ACCESSORIES, { errorMap: () => ({ message: `Phụ kiện phải thuộc ${ACCESSORIES.join(', ')}` }) }), {
      invalid_type_error: 'Phụ kiện phải là danh sách',
    })
    .nullish(),
});

const listQuerySchema = z.object({
  page: z.coerce.number({ invalid_type_error: 'Số trang phải là số nguyên dương' })
    .int('Số trang phải là số nguyên dương').min(1, 'Số trang phải là số nguyên dương').default(1),
  size: z.coerce.number({ invalid_type_error: 'Kích thước trang từ 1 đến 100' })
    .int('Kích thước trang từ 1 đến 100').min(1, 'Kích thước trang từ 1 đến 100')
    .max(100, 'Kích thước trang từ 1 đến 100').default(20),
  status: z.enum(STATUSES, { errorMap: () => ({ message: `Trạng thái phải thuộc ${STATUSES.join(', ')}` }) }).optional(),
});

const changeStatusSchema = z.object({
  to_status: z.enum(STATUSES, { errorMap: () => ({ message: `Trạng thái đích phải thuộc ${STATUSES.join(', ')}` }) }),
  note: z.string({ invalid_type_error: 'Ghi chú phải là chữ' }).max(255, 'Ghi chú tối đa 255 ký tự').nullish(),
});

const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'Mã phiếu phải là số nguyên dương' })
    .int('Mã phiếu phải là số nguyên dương').positive('Mã phiếu phải là số nguyên dương'),
});

// Chạy schema; sai thì ném AppError 400 kèm `fields` (lỗi đầu tiên của mỗi trường).
function parseOrThrow(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!(key in fields)) fields[key] = issue.message;
  }
  throw new AppError(400, 'DU_LIEU_KHONG_HOP_LE', 'Dữ liệu gửi lên không hợp lệ', fields);
}

module.exports = {
  createTicketSchema, listQuerySchema, changeStatusSchema, idParamSchema, parseOrThrow,
  PRIORITIES, STATUSES, ACCESSORIES,
};
