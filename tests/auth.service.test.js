// Kiểm tra logic xác thực khi thay repository bằng bản giả (không cần CSDL).
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'khoa-bi-mat-de-kiem-thu-0123456789';
const accountRepo = require('../src/backend/repositories/account.repository');
const centerRepo = require('../src/backend/repositories/center.repository');
const { hashPassword } = require('../src/backend/utils/password');
const { verifyToken } = require('../src/backend/utils/token');
const svc = require('../src/backend/services/auth.service');

let HASH;
test.before(async () => { HASH = await hashPassword('Quanly@123'); });
test.beforeEach(() => {
  svc.resetLockForTest();
  delete process.env.REGISTER_CODE_QUAN_LY;
  delete process.env.REGISTER_CODE_KY_THUAT_VIEN;
});

const ROW = () => ({ employee_id: '3', full_name: 'Quản lý Mẫu', role: 'QUAN_LY_TRUNG_TAM', center_id: '1', username: 'quanly', password_hash: HASH, is_active: true });
const IN = { username: 'quanly', password: 'Quanly@123' };
const NOW = Date.UTC(2026, 9, 30, 8, 0, 0);

test('EP11 luồng đúng: vai trò lấy từ tài khoản, token mang đúng vai trò, mã nhân viên, trung tâm; không lộ băm mật khẩu', async () => {
  accountRepo.findByUsername = async () => ROW();
  const r = await svc.login(IN, NOW);
  const p = verifyToken(r.token, NOW + 1000);
  assert.deepEqual([p.sub, p.role, p.cid], [3, 'QUAN_LY_TRUNG_TAM', 1]);
  assert.equal(r.expires_at, new Date(NOW + 1800 * 1000).toISOString());
  assert.equal(r.user.password_hash, undefined);
  assert.equal(JSON.stringify(r).includes('scrypt$'), false);
});

test('EP11 dữ liệu sai: sai mật khẩu, tên không tồn tại, tài khoản ngừng hoạt động đều cùng một câu 401', async () => {
  const casos = [
    [async () => ROW(), { ...IN, password: 'Sai@12345' }],
    [async () => null, IN],
    [async () => ({ ...ROW(), is_active: false }), IN],
  ];
  for (const [repo, input] of casos) {
    svc.resetLockForTest();
    accountRepo.findByUsername = repo;
    await assert.rejects(svc.login(input, NOW), { status: 401, code: 'SAI_THONG_TIN_DANG_NHAP', message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
});

test('EP11 biên: sai 5 lần liên tiếp thì lần 6 bị khoá 429 dù đúng mật khẩu; sau 15 phút mở lại', async () => {
  accountRepo.findByUsername = async () => ROW();
  for (let i = 0; i < 5; i++) {
    await assert.rejects(svc.login({ ...IN, password: 'Sai@12345' }, NOW + i), { status: 401 });
  }
  await assert.rejects(svc.login(IN, NOW + 10), { status: 429, code: 'TAI_KHOAN_TAM_KHOA' });
  const r = await svc.login(IN, NOW + 16 * 60 * 1000);
  assert.equal(r.user.username, 'quanly');
});

const REG = { full_name: 'An', username: 'an.nguyen', password: 'Matkhau123', role: 'NHAN_VIEN_TIEP_NHAN', center_id: 1 };

test('EP12 luồng đúng: Nhân viên tiếp nhận đăng ký tự do; mật khẩu được băm, không lưu bản gốc', async () => {
  let saved;
  centerRepo.findById = async () => ({ center_id: 1 });
  accountRepo.findByUsername = async () => null;
  accountRepo.createAccount = async (a) => { saved = a; return { employee_id: '61', full_name: a.fullName, role: a.role, center_id: a.centerId, username: a.username }; };
  const u = await svc.register(REG);
  assert.equal(u.employee_id, 61);
  assert.match(saved.passwordHash, /^scrypt\$/);
  assert.notEqual(saved.passwordHash, 'Matkhau123');
});

test('EP12 dữ liệu sai: vai trò quyền cao cần mã đăng ký; chưa cấu hình mã thì bị khoá; sai mã thì 403', async () => {
  let created = false;
  centerRepo.findById = async () => ({ center_id: 1 });
  accountRepo.findByUsername = async () => null;
  accountRepo.createAccount = async () => { created = true; return ROW(); };
  const QL = { ...REG, role: 'QUAN_LY_TRUNG_TAM' };
  await assert.rejects(svc.register(QL), { status: 403, code: 'DANG_KY_VAI_TRO_BI_KHOA' });
  process.env.REGISTER_CODE_QUAN_LY = 'QL-2026';
  await assert.rejects(svc.register({ ...QL, registration_code: 'doan-bay' }), { status: 403, code: 'MA_DANG_KY_SAI' });
  await assert.rejects(svc.register(QL), { status: 403, code: 'MA_DANG_KY_SAI' });
  assert.equal(created, false);
  assert.equal((await svc.register({ ...QL, registration_code: 'QL-2026' })).employee_id, 3);
});

test('EP12 dữ liệu sai: tên đã tồn tại -> 409 (kể cả hai yêu cầu đồng thời, CSDL báo 23505); trung tâm lạ -> 400', async () => {
  centerRepo.findById = async () => ({ center_id: 1 });
  accountRepo.findByUsername = async () => ROW();
  await assert.rejects(svc.register(REG), { status: 409, code: 'TEN_DANG_NHAP_DA_TON_TAI' });
  accountRepo.findByUsername = async () => null;
  accountRepo.createAccount = async () => { throw Object.assign(new Error('dup'), { code: '23505' }); };
  await assert.rejects(svc.register(REG), { status: 409, code: 'TEN_DANG_NHAP_DA_TON_TAI' });
  centerRepo.findById = async () => null;
  await assert.rejects(svc.register(REG), { status: 400, code: 'DU_LIEU_KHONG_HOP_LE' });
});
