// Lỗi nghiệp vụ có mã HTTP + mã lỗi máy đọc được (lớp API ánh xạ sang JSON).
// Định dạng lỗi thống nhất toàn API (buổi 9): { error, message, fields? }
class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;  // 400, 401, 403, 404, 409, 422
    this.code = code;      // ví dụ: DU_LIEU_KHONG_HOP_LE
    this.fields = fields;  // tùy chọn: { ten_truong: 'thông báo cho người dùng' }
  }
}
module.exports = AppError;
