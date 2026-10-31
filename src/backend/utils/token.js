// Mã phiên JWT (HS256) tự ký bằng crypto của Node. Hết hạn sau 30 phút (NFR2).
// Cấu trúc: base64url(header).base64url(payload).base64url(chữ ký HMAC-SHA256)
const crypto = require('node:crypto');

const TTL_SECONDS = 30 * 60;

class TokenError extends Error {
  constructor(reason) { super(reason); this.reason = reason; } // 'KHONG_HOP_LE' | 'HET_HAN'
}

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET chưa cấu hình hoặc ngắn hơn 16 ký tự. Xem .env.example');
  }
  return s;
}

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const sig = (data) => crypto.createHmac('sha256', secret()).update(data).digest();

function signToken(claims, now = Date.now(), ttl = TTL_SECONDS) {
  const iat = Math.floor(now / 1000);
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ ...claims, iat, exp: iat + ttl })}`;
  return `${body}.${sig(body).toString('base64url')}`;
}

function verifyToken(token, now = Date.now()) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new TokenError('KHONG_HOP_LE');
  const [h, p, s] = parts;
  let header, payload;
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString());
    payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  } catch { throw new TokenError('KHONG_HOP_LE'); }
  if (header.alg !== 'HS256') throw new TokenError('KHONG_HOP_LE'); // chặn kiểu tấn công alg=none
  const expected = sig(`${h}.${p}`);
  const actual = Buffer.from(s, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new TokenError('KHONG_HOP_LE');
  }
  if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now) throw new TokenError('HET_HAN');
  return payload;
}

module.exports = { signToken, verifyToken, TokenError, TTL_SECONDS };
