require('dotenv').config({ quiet: true });
const app = require('./app');
const { logger } = require('./utils/logger');

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, (err) => {
  if (err) {
    logger.error('không mở được cổng, API dừng', { port, err });
    process.exit(1);
  }
  logger.info('API đã khởi động', { port, moi_truong: process.env.NODE_ENV || 'development' });
});

// Docker gửi SIGTERM khi `docker compose down/stop`: đóng gọn thay vì chờ 10 giây rồi bị SIGKILL
function tatMay(tinHieu) {
  logger.info('nhận tín hiệu dừng', { tinHieu });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', () => tatMay('SIGTERM'));
process.on('SIGINT', () => tatMay('SIGINT'));
