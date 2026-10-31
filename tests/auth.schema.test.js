const test = require('node:test');
const assert = require('node:assert/strict');
const { loginSchema, registerSchema } = require('../src/backend/validators/auth.schema');

const REG = { full_name: 'Nguyễn Văn An', username: 'van.an', password: 'Matkhau123', role: 'NHAN_VIEN_TIEP_NHAN', center_id: 1 };
const loi = (schema, data) => { const r = schema.safeParse(data); return r.success ? null : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message])); };

test('luồng đúng: đăng nhập và đăng ký hợp lệ; tên đăng nhập được chuẩn hóa về chữ thường', () => {
  assert.equal(loginSchema.parse({ username: '  QuanLy ', password: 'x' }).username, 'quanly');
  const r = registerSchema.parse({ ...REG, username: 'Van.An', center_id: '3', registration_code: '' });
  assert.equal(r.username, 'van.an');
  assert.equal(r.center_id, 3);
  assert.equal(r.registration_code, undefined);
});

test('biên: mật khẩu 8 ký tự được nhận, 7 bị từ chối; tên đăng nhập 4 và 30 ký tự được nhận, 3 và 31 bị từ chối', () => {
  assert.equal(loi(registerSchema, { ...REG, password: 'Abcdef12' }), null);
  assert.match(loi(registerSchema, { ...REG, password: 'Abcde12' }).password, /tối thiểu 8/);
  assert.equal(loi(registerSchema, { ...REG, username: 'a'.repeat(4) }), null);
  assert.equal(loi(registerSchema, { ...REG, username: 'a'.repeat(30) }), null);
  assert.match(loi(registerSchema, { ...REG, username: 'abc' }).username, /tối thiểu 4/);
  assert.match(loi(registerSchema, { ...REG, username: 'a'.repeat(31) }).username, /tối đa 30/);
});

test('dữ liệu sai: lỗi theo từng trường bằng tiếng Việt (thiếu chữ số, ký tự lạ, vai trò lạ, thiếu trung tâm)', () => {
  const e = loi(registerSchema, { full_name: 'A', username: 'Nguyễn An', password: 'chiChuCai', role: 'ADMIN' });
  assert.match(e.full_name, /tối thiểu 2/);
  assert.match(e.username, /chữ thường không dấu/);
  assert.match(e.password, /chữ số/);
  assert.match(e.role, /vai trò hợp lệ/);
  assert.match(e.center_id, /chọn trung tâm/);
  assert.match(loi(loginSchema, { username: '', password: '' }).password, /nhập mật khẩu/);
});
