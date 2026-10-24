const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/backend/utils/AppError');
const { parseOrThrow } = require('../src/backend/validators/parse');
const { lookupCustomerQuerySchema, createCustomerSchema } = require('../src/backend/validators/customer.schema');

test('EP1: số điện thoại dạng +84 được chuẩn hóa về 0xxxxxxxxx (luồng đúng)', () => {
  assert.equal(parseOrThrow(lookupCustomerQuerySchema, { phone: '+84 901 234 567' }).phone, '0901234567');
});

test('EP1: thiếu hoặc sai số điện thoại -> 400 kèm fields.phone (dữ liệu sai)', () => {
  for (const q of [{}, { phone: '12345' }]) {
    assert.throws(() => parseOrThrow(lookupCustomerQuerySchema, q),
      (e) => e instanceof AppError && e.status === 400 && typeof e.fields.phone === 'string');
  }
});

test('EP2: họ tên 120 ký tự được nhận, 121 bị từ chối (giá trị biên)', () => {
  const base = { phone: '0901234567' };
  assert.ok(parseOrThrow(createCustomerSchema, { ...base, full_name: 'a'.repeat(120) }));
  assert.throws(() => parseOrThrow(createCustomerSchema, { ...base, full_name: 'a'.repeat(121) }), AppError);
});

test('EP2: email/address rỗng coi như null; email sai định dạng bị từ chối', () => {
  const out = parseOrThrow(createCustomerSchema, { full_name: 'An', phone: '0901234567', email: '', address: '  ' });
  assert.equal(out.email, null);
  assert.equal(out.address, null);
  assert.throws(() => parseOrThrow(createCustomerSchema, { full_name: 'An', phone: '0901234567', email: 'abc' }),
    (e) => e.fields.email === 'Email không hợp lệ');
});
