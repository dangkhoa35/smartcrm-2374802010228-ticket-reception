const express = require('express');
const cors = require('cors');
const { ganRequestId } = require('./utils/logger');
const actor = require('./middlewares/actor');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(ganRequestId);   // đứng ĐẦU: mọi dòng log phía sau đều có requestId

// Cho phép frontend (Vite, cổng 5173) gọi API. Đổi bằng biến môi trường CORS_ORIGIN.
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', actor, routes);

app.use(notFound);
app.use(errorHandler);   // đăng ký CUỐI CÙNG

module.exports = app;
