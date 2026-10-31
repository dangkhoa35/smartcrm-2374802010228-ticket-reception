const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'khoa-bi-mat-de-kiem-thu-0123456789';
const { signToken, verifyToken, TokenError } = require('../src/backend/utils/token');

const CLAIMS = { sub: 7, role: 'QUAN_LY_TRUNG_TAM', cid: 2 };
const T0 = Date.UTC(2026, 9, 30, 8, 0, 0);

test('luồng đúng: ký rồi kiểm lại ra đúng thông tin, hạn 30 phút', () => {
  const p = verifyToken(signToken(CLAIMS, T0), T0 + 1000);
  assert.equal(p.sub, 7);
  assert.equal(p.role, 'QUAN_LY_TRUNG_TAM');
  assert.equal(p.exp - p.iat, 1800);
});

test('biên: còn 1 giây thì hợp lệ, đúng thời điểm hết hạn thì HET_HAN', () => {
  const t = signToken(CLAIMS, T0);
  assert.doesNotThrow(() => verifyToken(t, T0 + 1799 * 1000));
  assert.throws(() => verifyToken(t, T0 + 1800 * 1000), { reason: 'HET_HAN' });
});

test('dữ liệu sai: sửa nội dung (nâng vai trò), đổi khoá ký, alg=none, rỗng đều bị từ chối', () => {
  const t = signToken({ sub: 1, role: 'NHAN_VIEN_TIEP_NHAN', cid: 1 }, T0);
  const [h, , s] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 1, role: 'QUAN_LY_TRUNG_TAM', cid: 1, iat: 0, exp: 9e9 })).toString('base64url');
  assert.throws(() => verifyToken(`${h}.${forged}.${s}`, T0), TokenError);

  const noneHdr = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  assert.throws(() => verifyToken(`${noneHdr}.${forged}.`, T0), { reason: 'KHONG_HOP_LE' });

  process.env.JWT_SECRET = 'mot-khoa-khac-hoan-toan-0123456789';
  assert.throws(() => verifyToken(t, T0), { reason: 'KHONG_HOP_LE' });
  process.env.JWT_SECRET = 'khoa-bi-mat-de-kiem-thu-0123456789';

  for (const bad of ['', 'abc', 'a.b', null, undefined]) {
    assert.throws(() => verifyToken(bad, T0), TokenError);
  }
});

test('thiếu hoặc quá ngắn JWT_SECRET: ném lỗi cấu hình rõ ràng, không ký bằng khoá rỗng', () => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'ngan';
  assert.throws(() => signToken(CLAIMS, T0), /JWT_SECRET/);
  delete process.env.JWT_SECRET;
  assert.throws(() => signToken(CLAIMS, T0), /JWT_SECRET/);
  process.env.JWT_SECRET = old;
});
