const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'KHONG_TIM_THAY', `Không có đường dẫn ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.code, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'DU_LIEU_KHONG_HOP_LE', message: 'JSON không hợp lệ' });
  }
  console.error(err);
  res.status(500).json({ error: 'LOI_HE_THONG', message: 'Lỗi hệ thống' });
}

module.exports = { notFound, errorHandler };
