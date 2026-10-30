const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

// Mã lỗi cho biết CSDL/hạ tầng không với tới được -> 503 thay vì 500
const MA_LOI_HA_TANG = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', '57P01', '57P03', '08000', '08001', '08003', '08006']);

const boiCanh = (req) => ({
  requestId: req.requestId,
  phuong_thuc: req.method,
  duong_dan: (req.originalUrl || req.path).split('?')[0],
  vai_tro: req.actor?.role,
  nhan_vien_id: req.actor?.employeeId,
});

function notFound(req, res, next) {
  next(new AppError(404, 'KHONG_TIM_THAY', `Không có đường dẫn ${req.method} ${req.originalUrl}`));
}

// MỘT bộ xử lý lỗi duy nhất, đăng ký CUỐI CÙNG trong app.js.
// Định dạng lỗi: { error: mã máy đọc, message: câu cho người đọc, fields?: lỗi theo trường }
// - Lỗi nghiệp vụ / dữ liệu vào sai (AppError 4xx): ghi INFO, KHÔNG phải ERROR.
// - Lỗi hệ thống: ghi ERROR kèm requestId và ngăn xếp đúng MỘT lần; người dùng chỉ thấy mã tra cứu.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    logger.info('yêu cầu bị từ chối', { ...boiCanh(req), ma: err.code, ma_trang_thai: err.status });
    const body = { error: err.code, message: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed') {
    logger.info('JSON không hợp lệ', { ...boiCanh(req), ma: 'DU_LIEU_KHONG_HOP_LE' });
    return res.status(400).json({ error: 'DU_LIEU_KHONG_HOP_LE', message: 'JSON không hợp lệ' });
  }
  const status = MA_LOI_HA_TANG.has(err.code) ? 503 : 500;
  logger.error('lỗi hệ thống', { ...boiCanh(req), ma_trang_thai: status, err });
  res.status(status).json({
    error: 'LOI_HE_THONG',
    message: `Hệ thống đang gặp sự cố. Vui lòng thử lại. Mã tra cứu: ${req.requestId}`,
  });
}

module.exports = { notFound, errorHandler };
