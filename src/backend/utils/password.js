// Băm và kiểm tra mật khẩu bằng scrypt của Node (không cần thư viện ngoài).
// Định dạng lưu: scrypt$<muối hex>$<băm hex>. Mỗi mật khẩu có MUỐI NGẪU NHIÊN riêng,
// nên hai người cùng mật khẩu vẫn có hai chuỗi băm khác nhau.
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const KEY_LEN = 64;

async function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(plain, salt, KEY_LEN);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(plain, stored) {
  const [alg, saltHex, keyHex] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length === 0) return false;
  const actual = await scrypt(String(plain), Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected); // so sánh thời gian không đổi
}

module.exports = { hashPassword, verifyPassword };
