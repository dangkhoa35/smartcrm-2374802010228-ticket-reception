const test = require('node:test');
const assert = require('node:assert');
const AppError = require('../src/backend/utils/AppError');
const { errorHandler } = require('../src/backend/middlewares/errorHandler');

function chay(err) {
  const goc = process.stdout.write;
  const dong = [];
  process.stdout.write = (s) => { dong.push(String(s)); return true; };
  const res = { status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  const req = { requestId: 'req-123', method: 'POST', path: '/api/tickets' };
  try { errorHandler(err, req, res, () => {}); } finally { process.stdout.write = goc; }
  return { res, log: dong.map((d) => JSON.parse(d)) };
}

test('lỗi nghiệp vụ -> đúng mã HTTP, ghi INFO (không phải ERROR)', () => {
  const { res, log } = chay(new AppError(409, 'PHIEU_DANG_MO', 'Thiết bị đang có phiếu chưa hoàn tất'));
  assert.strictEqual(res.code, 409);
  assert.deepStrictEqual(res.body, { error: 'PHIEU_DANG_MO', message: 'Thiết bị đang có phiếu chưa hoàn tất' });
  assert.strictEqual(log.length, 1);
  assert.strictEqual(log[0].muc, 'info');
});

test('lỗi hệ thống -> 500, thông điệp chung + mã tra cứu, KHÔNG lộ chi tiết, log ERROR đúng một lần', () => {
  const { res, log } = chay(new Error('relation "ticket" does not exist'));
  assert.strictEqual(res.code, 500);
  assert.strictEqual(res.body.error, 'LOI_HE_THONG');
  assert.ok(res.body.message.includes('req-123'));
  assert.ok(!JSON.stringify(res.body).includes('relation'));
  assert.ok(!JSON.stringify(res.body).includes('stack'));
  assert.strictEqual(log.length, 1);
  assert.strictEqual(log[0].muc, 'error');
  assert.strictEqual(log[0].requestId, 'req-123');
  assert.ok(log[0].loi.stack);                              // chi tiết kỹ thuật nằm TRONG LOG
});

test('mất kết nối CSDL -> 503 nhưng vẫn cùng mã lỗi LOI_HE_THONG', () => {
  const e = new Error('connect ECONNREFUSED'); e.code = 'ECONNREFUSED';
  const { res } = chay(e);
  assert.strictEqual(res.code, 503);
  assert.strictEqual(res.body.error, 'LOI_HE_THONG');
});

// BUG: trong Docker, khi container CSDL dừng, tên "db" không phân giải được -> Node báo EAI_AGAIN.
// Mã này chưa nằm trong danh sách lỗi hạ tầng nên bị trả 500 thay vì 503.
test('không phân giải được tên máy CSDL (EAI_AGAIN) -> 503', () => {
  const e = new Error('getaddrinfo EAI_AGAIN db'); e.code = 'EAI_AGAIN';
  const { res, log } = chay(e);
  assert.strictEqual(res.code, 503);
  assert.strictEqual(res.body.error, 'LOI_HE_THONG');
  assert.strictEqual(log[0].ma_trang_thai, 503);
});