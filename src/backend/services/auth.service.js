// Nghiệp vụ xác thực: đăng nhập (EP11), đăng ký (EP12), danh sách trung tâm (EP13).
// Không có req/res/mã HTTP: lớp API (auth.routes.js) lo phần đó.
const AppError = require('../utils/AppError');
const accountRepo = require('../repositories/account.repository');
const centerRepo = require('../repositories/center.repository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken, TTL_SECONDS } = require('../utils/token');

// Vai trò có quyền cao phải nhập "mã đăng ký" do quản trị cấp (biến môi trường).
// Chưa cấu hình mã -> KHÔNG ai tự đăng ký được vai trò đó.
const CODE_ENV = { KY_THUAT_VIEN: 'REGISTER_CODE_KY_THUAT_VIEN', QUAN_LY_TRUNG_TAM: 'REGISTER_CODE_QUAN_LY' };

const LOCK_AFTER = 5;               // số lần sai liên tiếp
const LOCK_MS = 15 * 60 * 1000;     // khoá 15 phút
const attempts = new Map();         // username -> { count, firstAt }  (bộ nhớ tiến trình)

const SAI_THONG_TIN = () => new AppError(401, 'SAI_THONG_TIN_DANG_NHAP',
  'Sai tên đăng nhập hoặc mật khẩu');

let dummyHash; // băm giả để tên đăng nhập không tồn tại cũng tốn thời gian như tồn tại
const getDummy = () => (dummyHash ||= hashPassword('mat-khau-gia-0'));

function checkLock(username, now) {
  const a = attempts.get(username);
  if (!a) return;
  if (now - a.firstAt > LOCK_MS) { attempts.delete(username); return; }
  if (a.count >= LOCK_AFTER) {
    throw new AppError(429, 'TAI_KHOAN_TAM_KHOA', 'Nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút');
  }
}
function recordFail(username, now) {
  const a = attempts.get(username);
  if (!a || now - a.firstAt > LOCK_MS) attempts.set(username, { count: 1, firstAt: now });
  else a.count += 1;
}

const toUser = (row) => ({
  employee_id: Number(row.employee_id), full_name: row.full_name, username: row.username,
  role: row.role, center_id: Number(row.center_id),
});

// EP11
async function login({ username, password }, now = Date.now()) {
  checkLock(username, now);
  const row = await accountRepo.findByUsername(username);
  // Luôn tốn một lần băm, dù tài khoản có tồn tại hay không
  const ok = await verifyPassword(password, row ? row.password_hash : await getDummy());
  if (!row || !ok || !row.is_active) {
    recordFail(username, now);
    throw SAI_THONG_TIN(); // cùng một câu cho mọi nguyên nhân: không lộ tài khoản nào có thật
  }
  attempts.delete(username);
  const user = toUser(row);
  const token = signToken(
    { sub: user.employee_id, role: user.role, cid: user.center_id, name: user.full_name, usr: user.username }, now);
  return { token, expires_at: new Date(now + TTL_SECONDS * 1000).toISOString(), user };
}

// EP12
async function register(input) {
  const need = CODE_ENV[input.role];
  if (need) {
    const expected = process.env[need];
    if (!expected) {
      throw new AppError(403, 'DANG_KY_VAI_TRO_BI_KHOA', 'Vai trò này không mở đăng ký tự do. Vui lòng liên hệ quản trị');
    }
    if (input.registration_code !== expected) {
      throw new AppError(403, 'MA_DANG_KY_SAI', 'Mã đăng ký không đúng',
        { registration_code: 'Mã đăng ký không đúng' });
    }
  }
  if (!(await centerRepo.findById(input.center_id))) {
    throw new AppError(400, 'DU_LIEU_KHONG_HOP_LE', 'Dữ liệu gửi lên không hợp lệ',
      { center_id: 'Trung tâm bảo hành không tồn tại' });
  }
  const dup = () => new AppError(409, 'TEN_DANG_NHAP_DA_TON_TAI', 'Tên đăng nhập này đã có người dùng',
    { username: 'Tên đăng nhập này đã có người dùng' });
  if (await accountRepo.findByUsername(input.username)) throw dup();
  try {
    const row = await accountRepo.createAccount({
      fullName: input.full_name, username: input.username, role: input.role,
      centerId: input.center_id, passwordHash: await hashPassword(input.password),
    });
    return toUser(row);
  } catch (e) {
    if (e.code === '23505') throw dup(); // hai yêu cầu đồng thời cùng tên: CSDL chặn bằng UNIQUE
    throw e;
  }
}

// EP13 – công khai, chỉ để đổ ô chọn trung tâm ở trang đăng ký
async function listCenters() {
  const rows = await centerRepo.listAll();
  return rows.map((r) => ({ center_id: Number(r.center_id), center_code: r.center_code, center_name: r.center_name, city: r.city }));
}

function resetLockForTest() { attempts.clear(); }

module.exports = { login, register, listCenters, resetLockForTest };
