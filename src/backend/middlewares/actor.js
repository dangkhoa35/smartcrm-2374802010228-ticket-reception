// Xác thực mọi yêu cầu /api/* (trừ /api/auth/*): đọc "Authorization: Bearer <token>",
// kiểm chữ ký + hạn 30 phút, rồi gán req.actor cho các lớp phía sau.
// Vai trò, mã nhân viên, trung tâm lấy TỪ TOKEN do máy chủ ký, không lấy từ header tự khai.
const AppError = require('../utils/AppError');
const { verifyToken, TokenError } = require('../utils/token');

module.exports = function actor(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') || '');
  if (!m) return next(new AppError(401, 'CHUA_XAC_THUC', 'Vui lòng đăng nhập'));
  try {
    const p = verifyToken(m[1]);
    req.actor = { role: p.role, employeeId: Number(p.sub), centerId: Number(p.cid), fullName: p.name };
    return next();
  } catch (e) {
    if (e instanceof TokenError) {
      const hetHan = e.reason === 'HET_HAN';
      return next(new AppError(401, hetHan ? 'PHIEN_HET_HAN' : 'CHUA_XAC_THUC',
        hetHan ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại' : 'Phiên đăng nhập không hợp lệ'));
    }
    return next(e); // ví dụ thiếu JWT_SECRET: lỗi hệ thống, errorHandler ghi log
  }
};
