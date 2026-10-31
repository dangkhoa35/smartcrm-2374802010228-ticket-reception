// Kiểm tra bảo vệ API bằng token: gọi app thật qua HTTP, KHÔNG cần CSDL
// (mọi yêu cầu dưới đây bị chặn hoặc từ chối ở bước xác thực/kiểm tra đầu vào, trước khi chạm CSDL).
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'khoa-bi-mat-de-kiem-thu-0123456789';
const app = require('../src/backend/app');
const { signToken } = require('../src/backend/utils/token');

let server, base;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const call = (path, opts = {}) => fetch(base + path, opts).then(async (r) => ({ status: r.status, body: await r.json() }));

test('dữ liệu sai: không token, token giả, header x-role tự khai đều bị 401', async () => {
  assert.deepEqual((await call('/api/tickets')).body.error, 'CHUA_XAC_THUC');
  assert.equal((await call('/api/tickets', { headers: { authorization: 'Bearer gia.mao.khong-hop-le' } })).status, 401);
  // cách cũ (Sprint 1) – tự khai vai trò bằng header – không còn có tác dụng
  const cu = await call('/api/tickets', { headers: { 'x-role': 'QUAN_LY_TRUNG_TAM', 'x-employee-id': '3', 'x-center-id': '1' } });
  assert.equal(cu.status, 401);
});

test('biên: token đã hết hạn -> 401 PHIEN_HET_HAN', async () => {
  const cu = signToken({ sub: 1, role: 'NHAN_VIEN_TIEP_NHAN', cid: 1 }, Date.now() - 31 * 60 * 1000);
  const r = await call('/api/tickets', { headers: { authorization: `Bearer ${cu}` } });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'PHIEN_HET_HAN');
});

test('luồng đúng: token hợp lệ qua bước xác thực; sai vai trò bị chặn 403 (Quản lý không tạo khách hàng)', async () => {
  const t = signToken({ sub: 3, role: 'QUAN_LY_TRUNG_TAM', cid: 1 });
  const r = await call('/api/customers?phone=0901234567', { headers: { authorization: `Bearer ${t}` } });
  assert.equal(r.status, 403);
  assert.equal(r.body.error, 'KHONG_DU_QUYEN');
});

test('EP11/EP12 công khai (không cần token) và kiểm đầu vào trước khi chạm CSDL: 400 kèm fields theo từng trường', async () => {
  const post = (path, body) => call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const a = await post('/api/auth/login', { username: '', password: '' });
  assert.equal(a.status, 400);
  assert.match(a.body.fields.username, /tên đăng nhập/);
  const b = await post('/api/auth/register', { full_name: 'A', username: 'x', password: '1', role: 'ADMIN' });
  assert.equal(b.status, 400);
  assert.ok(b.body.fields.password && b.body.fields.role && b.body.fields.center_id);
});
