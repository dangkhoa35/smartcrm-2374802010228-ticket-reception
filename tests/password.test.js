const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/backend/utils/password');

test('luồng đúng: băm rồi kiểm lại đúng mật khẩu; chuỗi băm không chứa mật khẩu gốc', async () => {
  const h = await hashPassword('Quanly@123');
  assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!h.includes('Quanly@123'));
  assert.equal(await verifyPassword('Quanly@123', h), true);
});

test('hai lần băm cùng mật khẩu cho hai chuỗi khác nhau (muối ngẫu nhiên)', async () => {
  assert.notEqual(await hashPassword('Abcdef12'), await hashPassword('Abcdef12'));
});

test('dữ liệu sai: sai mật khẩu, chuỗi lưu hỏng, rỗng, null đều trả false, không ném lỗi', async () => {
  const h = await hashPassword('Abcdef12');
  assert.equal(await verifyPassword('abcdef12', h), false);   // sai chữ hoa
  assert.equal(await verifyPassword('Abcdef12', 'khong-phai-bam'), false);
  assert.equal(await verifyPassword('Abcdef12', 'scrypt$$'), false);
  assert.equal(await verifyPassword('Abcdef12', null), false);
});
