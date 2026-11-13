const express = require('express');
const cors = require('cors');
const { ganRequestId } = require('./utils/logger');
const actor = require('./middlewares/actor');
const routes = require('./routes');
const authRoutes = require('./routes/auth.routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(ganRequestId);   // đứng ĐẦU: mọi dòng log phía sau đều có requestId

// Cho phép frontend (Vite, cổng 5173) gọi API. Danh sách nguồn lấy từ biến môi trường
// CORS_ORIGIN, nhiều nguồn cách nhau bằng dấu phẩy. KHÔNG dùng origin: '*'.
// Yêu cầu không có header Origin (curl, test, gọi từ máy chủ) không bị CORS chặn: CORS là cơ chế
// của TRÌNH DUYỆT, không thay thế xác thực (đã có middleware actor ở dưới).
const NGUON_CHO_PHEP = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (nguon, cb) => cb(null, !nguon || NGUON_CHO_PHEP.includes(nguon)),
  maxAge: 600,
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);   // công khai: đăng nhập / đăng ký
app.use('/api', actor, routes);     // còn lại: bắt buộc có token

app.use(notFound);
app.use(errorHandler);   // đăng ký CUỐI CÙNG

module.exports = app;
