// CORS chỉ mở cho các nguồn trong CORS_ORIGIN (danh sách cách nhau bằng dấu phẩy), không mở cho mọi nguồn.
// Gọi app thật qua HTTP, KHÔNG cần CSDL (/health không chạm CSDL).
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'khoa-bi-mat-de-kiem-thu-0123456789';
process.env.CORS_ORIGIN = 'http://localhost:5173, http://localhost:3001';
const app = require('../src/backend/app');

let server, base;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const acao = (r) => r.headers.get('access-control-allow-origin');

test('nguồn nằm trong danh sách (cả hai nguồn) được phép', async () => {
  for (const o of ['http://localhost:5173', 'http://localhost:3001']) {
    const r = await fetch(`${base}/health`, { headers: { origin: o } });
    assert.equal(r.status, 200);
    assert.equal(acao(r), o);
  }
});

test('nguồn lạ không được cấp quyền CORS, kể cả với preflight', async () => {
  const get = await fetch(`${base}/health`, { headers: { origin: 'http://trang-la.example' } });
  assert.equal(acao(get), null);
  const pre = await fetch(`${base}/api/tickets`, {
    method: 'OPTIONS',
    headers: { origin: 'http://trang-la.example', 'access-control-request-method': 'GET' },
  });
  assert.equal(acao(pre), null);
});

test('không bao giờ trả "*"', async () => {
  const r = await fetch(`${base}/health`, { headers: { origin: 'http://trang-la.example' } });
  assert.notEqual(acao(r), '*');
});

test('yêu cầu không có Origin (curl, máy chủ gọi máy chủ) vẫn chạy bình thường', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
});
