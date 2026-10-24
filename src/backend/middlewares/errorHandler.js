const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'KHONG_TIM_THAY', `Không có đường dẫn ${req.method} ${req.originalUrl}`));
}

// Định dạng lỗi duy nhất: { error: mã máy đọc, message: câu cho người đọc, fields?: lỗi theo trường }
// Frontend rẽ nhánh theo `error`, không theo câu chữ của `message`.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.code, message: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'DU_LIEU_KHONG_HOP_LE', message: 'JSON không hợp lệ' });
  }
  // Chi tiết kỹ thuật chỉ ghi log, KHÔNG gửi cho người dùng. Mã tra cứu để đối chiếu log.
  const ref = Date.now().toString(36).toUpperCase();
  console.error(`[${ref}]`, err);
  res.status(500).json({
    error: 'LOI_HE_THONG',
    message: `Hệ thống đang gặp sự cố. Vui lòng thử lại. Mã tra cứu: ${ref}`,
  });
}

module.exports = { notFound, errorHandler };
