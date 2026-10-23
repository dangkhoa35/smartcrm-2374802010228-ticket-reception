const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, maskPhone } = require('../src/backend/utils/phone');

test('QT02: chuẩn hóa bốn dạng số điện thoại về 0xxxxxxxxx', () => {
  assert.equal(normalizePhone('0901234567'), '0901234567');
  assert.equal(normalizePhone('84901234567'), '0901234567');
  assert.equal(normalizePhone('+84 901 234 567'), '0901234567');
  assert.equal(normalizePhone('0901.234.567'), '0901234567');
});

test('số điện thoại rỗng hoặc sai độ dài trả về null', () => {
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone('12345'), null);
});

test('NFR2: che số điện thoại giữ 3 số đầu và 3 số cuối', () => {
  assert.equal(maskPhone('0901234567'), '090****567');
});
