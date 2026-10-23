// Lỗi nghiệp vụ có mã HTTP + mã lỗi máy đọc được (lớp API ánh xạ sang JSON).
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;   // 400, 401, 403, 404, 409, 422
    this.code = code;       // ví dụ: DU_LIEU_KHONG_HOP_LE
    this.details = details; // tùy chọn: danh sách lỗi từng trường
  }
}
module.exports = AppError;
