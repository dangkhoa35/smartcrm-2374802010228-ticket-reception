// BT3 – tầng API (2 test): gọi HTTP thật vào app Express + PostgreSQL thật, có đăng nhập bằng token.
const { prepareDb, resetDb, seedFixtures, count } = require('../helpers/db'); // PHẢI đứng đầu
const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../../src/backend/db/pool');
const app = require('../../src/backend/app');

let server; let base;

async function api(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}
const dangNhap = async (username, password) => (await api('POST', '/api/auth/login', { body: { username, password } })).body.data.token;
const dangKy = (b) => api('POST', '/api/auth/register', { body: b });

test.before(async () => {
  await prepareDb();
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { server.close(); await pool.end(); });
test.beforeEach(async () => { await resetDb(pool); await seedFixtures(pool); });

test('TC-11 bảo mật A01: người của trung tâm khác không đọc/sửa được phiếu; sai vai trò -> 403; không token -> 401', async () => {
  const tn = await dangNhap('tiepnhan', 'Tiepnhan@123');                       // tiếp nhận, trung tâm 1
  const tao = await api('POST', '/api/tickets', { token: tn, body: { customer_id: 1, device_id: 1, issue_desc: 'Loa ngoài bị rè khi gọi' } });
  assert.equal(tao.status, 201);
  const id = tao.body.data.ticket_id;

  // Kỹ thuật viên của trung tâm 2 (tự đăng ký bằng mã đăng ký test)
  assert.equal((await dangKy({ full_name: 'KTV Trung tâm 2', username: 'ktv.tt2', password: 'Matkhau123', role: 'KY_THUAT_VIEN', center_id: 2, registration_code: 'ma-dang-ky-chi-de-test' })).status, 201);
  const ktv2 = await dangNhap('ktv.tt2', 'Matkhau123');
  const doc = await api('GET', `/api/tickets/${id}`, { token: ktv2 });
  assert.equal(doc.status, 404);
  assert.equal(doc.body.error, 'KHONG_TIM_THAY');
  const sua = await api('PATCH', `/api/tickets/${id}/status`, { token: ktv2, body: { to_status: 'DA_HUY' } });
  assert.equal(sua.status, 404);

  // Nhân viên tiếp nhận không có quyền đổi trạng thái
  const cam = await api('PATCH', `/api/tickets/${id}/status`, { token: tn, body: { to_status: 'DA_HUY' } });
  assert.equal(cam.status, 403);
  assert.equal(cam.body.error, 'KHONG_DU_QUYEN');

  assert.equal((await api('GET', `/api/tickets/${id}`)).status, 401);            // không token

  // Tác dụng phụ: phiếu vẫn nguyên trạng thái MOI, lịch sử vẫn 1 dòng
  assert.equal((await pool.query('SELECT status FROM ticket WHERE ticket_id = $1', [id])).rows[0].status, 'MOI');
  assert.equal(await count(pool, 'ticket_status_log'), 1);
});

test('TC-12 luồng đúng: POST /api/tickets -> 201, dữ liệu đúng trong CSDL, số điện thoại bị che với nhân viên tiếp nhận', async () => {
  const tn = await dangNhap('tiepnhan', 'Tiepnhan@123');
  const tao = await api('POST', '/api/tickets', { token: tn, body: { customer_id: 1, device_id: 1, issue_desc: 'Pin sụt nhanh, sạc không vào điện', priority: 'THAP' } });
  assert.equal(tao.status, 201);
  assert.match(tao.body.data.ticket_code, /^BH-\d{6}\/\d{4}$/);
  assert.equal(tao.body.data.status, 'MOI');
  assert.equal(tao.body.data.priority, 'THAP');
  assert.equal(await count(pool, 'ticket'), 1);

  const ct = await api('GET', `/api/tickets/${tao.body.data.ticket_id}`, { token: tn });
  assert.equal(ct.status, 200);
  assert.match(ct.body.data.customer_phone, /^090\*+567$/);                      // 0901234567 -> 090****567 (NFR2)
});