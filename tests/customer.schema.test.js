const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/backend/utils/AppError');
const { parseOrThrow } = require('../src/backend/validators/parse');
const {
  lookupCustomerQuerySchema, createCustomerSchema, createDeviceSchema,
} = require('../src/backend/validators/customer.schema');

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

// ---- A2: thêm thiết bị (EP9) ----
test('EP9: thiết bị hợp lệ, ngày mua để trống thành null (luồng đúng)', () => {
  const out = parseOrThrow(createDeviceSchema, {
    product_name: ' iPhone 15 ', serial_no: 'SN001', purchase_date: '', warranty_months: 12,
  });
  assert.equal(out.product_name, 'iPhone 15');
  assert.equal(out.purchase_date, null);
});

test('EP9: số tháng bảo hành 0 và 120 được nhận, -1 và 121 bị từ chối (giá trị biên)', () => {
  const base = { product_name: 'X', serial_no: 'S1' };
  assert.ok(parseOrThrow(createDeviceSchema, { ...base, warranty_months: 0 }));
  assert.ok(parseOrThrow(createDeviceSchema, { ...base, warranty_months: 120 }));
  assert.throws(() => parseOrThrow(createDeviceSchema, { ...base, warranty_months: -1 }), AppError);
  assert.throws(() => parseOrThrow(createDeviceSchema, { ...base, warranty_months: 121 }), AppError);
});

test('EP9: thiếu serial, ngày mua ở tương lai hoặc không tồn tại -> 400 kèm fields (dữ liệu sai)', () => {
  assert.throws(() => parseOrThrow(createDeviceSchema, { product_name: 'X', warranty_months: 12 }),
    (e) => e.fields.serial_no === 'Vui lòng nhập số serial');
  assert.throws(() => parseOrThrow(createDeviceSchema,
    { product_name: 'X', serial_no: 'S1', purchase_date: '2999-01-01', warranty_months: 12 }),
  (e) => e.fields.purchase_date === 'Ngày mua không được ở tương lai');
  assert.throws(() => parseOrThrow(createDeviceSchema,
    { product_name: 'X', serial_no: 'S1', purchase_date: '2026-02-30', warranty_months: 12 }),
  (e) => e.fields.purchase_date === 'Ngày mua không tồn tại');
});
