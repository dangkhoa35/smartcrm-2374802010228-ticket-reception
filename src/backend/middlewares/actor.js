// TẠM THỜI cho Sprint 1: chưa có đăng nhập, lấy người thao tác từ header.
// Sẽ thay bằng phiên đăng nhập (hết hạn sau 30 phút, NFR2) ở BT2.
//   x-role:        NHAN_VIEN_TIEP_NHAN (mặc định) | KY_THUAT_VIEN | QUAN_LY_TRUNG_TAM
//   x-employee-id: mặc định 1 (id trong bảng employee)
//   x-center-id:   mặc định 1 (Trung tâm bảo hành của người thao tác)
const AppError = require('../utils/AppError');

const ROLES = ['NHAN_VIEN_TIEP_NHAN', 'KY_THUAT_VIEN', 'QUAN_LY_TRUNG_TAM'];

module.exports = function actor(req, res, next) {
  const role = req.get('x-role') || 'NHAN_VIEN_TIEP_NHAN';
  if (!ROLES.includes(role)) {
    return next(new AppError(401, 'CHUA_XAC_THUC', 'Vai trò không hợp lệ'));
  }
  req.actor = {
    role,
    employeeId: Number(req.get('x-employee-id') || 1),
    centerId: Number(req.get('x-center-id') || 1),
  };
  next();
};
