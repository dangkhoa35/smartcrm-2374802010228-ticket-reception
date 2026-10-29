const test = require('node:test');
const assert = require('node:assert');
const { logger, che } = require('../src/backend/utils/logger');
const { EventEmitter } = require('node:events');
const { ganRequestId } = require('../src/backend/utils/logger');

// Chụp những gì logger ghi ra stdout trong khi chạy fn (đồng bộ)
function chupLog(fn) {
  const goc = process.stdout.write;
  const dong = [];
  process.stdout.write = (s) => { dong.push(String(s)); return true; };
  try { fn(); } finally { process.stdout.write = goc; }
  return dong.map((d) => JSON.parse(d));
}

test('log là một dòng JSON có thời điểm ISO, mức, thông điệp và ngữ cảnh', () => {
  const [l] = chupLog(() => logger.info('đã tạo phiếu', { requestId: 'r-1', ticketCode: 'BH-000231/2026' }));
  assert.strictEqual(l.muc, 'info');
  assert.strictEqual(l.requestId, 'r-1');
  assert.ok(!Number.isNaN(Date.parse(l.thoi_diem)));
});

test('log che SĐT, token, mật khẩu, chuỗi kết nối (kể cả lồng nhau)', () => {
  const [l] = chupLog(() => logger.info('thử', {
    customer: { id: 1024, phone: '0901234567' },
    headers: { authorization: 'Bearer abc' },
    password: 'matkhau', DATABASE_URL: 'postgres://u:p@h/db',
  }));
  const chuoi = JSON.stringify(l);
  assert.strictEqual(l.customer.id, 1024);                 // ID thì được ghi
  assert.ok(!chuoi.includes('0901234567'));
  assert.ok(!chuoi.includes('Bearer abc'));
  assert.ok(!chuoi.includes('matkhau'));
  assert.ok(!chuoi.includes('postgres://'));
});

test('LOG_LEVEL=warn thì không ghi INFO nhưng vẫn ghi ERROR', () => {
  const cu = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = 'warn';
  try {
    const dong = chupLog(() => { logger.info('bỏ'); logger.error('giữ'); });
    assert.deepStrictEqual(dong.map((d) => d.muc), ['error']);
  } finally {
    if (cu === undefined) delete process.env.LOG_LEVEL; else process.env.LOG_LEVEL = cu;
  }
});

test('che() chuyển Error thành đối tượng có loại, thông điệp, ngăn xếp', () => {
  const r = che(new Error('hỏng'));
  assert.strictEqual(r.thong_diep, 'hỏng');
  assert.ok(r.stack);
});

test('log yêu cầu hoàn tất ghi đường dẫn ĐẦY ĐỦ, không có query string (BUG đường dẫn "/")', () => {
  const req = { method: 'GET', originalUrl: '/api/tickets?phone=0901234567', path: '/', get: () => undefined };
  const res = Object.assign(new EventEmitter(), { statusCode: 200, setHeader() {} });
  const [l] = chupLog(() => { ganRequestId(req, res, () => {}); res.emit('finish'); });
  assert.strictEqual(l.duong_dan, '/api/tickets');
  assert.ok(!JSON.stringify(l).includes('0901234567'));
});