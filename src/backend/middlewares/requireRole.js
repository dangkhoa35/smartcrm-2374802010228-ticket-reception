// Lớp API kiểm vai trò (Mục 3.2 trong BT1). Sai vai trò -> 403.
const AppError = require('../utils/AppError');

module.exports = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.actor.role)) {
    return next(new AppError(403, 'KHONG_DU_QUYEN', 'Vai trò này không được thực hiện thao tác'));
  }
  next();
};
