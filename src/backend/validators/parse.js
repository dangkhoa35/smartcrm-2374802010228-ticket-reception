// Chạy schema zod ở ranh giới; sai thì ném AppError 400 kèm `fields`
// (lỗi đầu tiên của mỗi trường). Dùng chung cho mọi validator.
const AppError = require('../utils/AppError');

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

module.exports = { parseOrThrow };
