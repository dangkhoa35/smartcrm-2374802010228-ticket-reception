const test = require('node:test');
const assert = require('node:assert/strict');
const { TRANSITIONS, isUnderWarranty } = require('../src/backend/services/ticket.service');

test('QT01: còn bảo hành khi ngày tiếp nhận <= ngày mua + số tháng bảo hành', () => {
  const device = { purchase_date: new Date(2026, 2, 10), warranty_months: 12 };
  assert.equal(isUnderWarranty(device, new Date(2026, 9, 20)), true);
});

test('QT01: hết bảo hành khi quá hạn', () => {
  const device = { purchase_date: new Date(2025, 0, 15), warranty_months: 12 };
  assert.equal(isUnderWarranty(device, new Date(2026, 9, 20)), false);
});

test('QT01: không có ngày mua thì coi như không còn bảo hành', () => {
  assert.equal(isUnderWarranty({ purchase_date: null, warranty_months: 12 }, new Date()), false);
});

test('QT03: vòng đời chỉ đi tới, không quay lại', () => {
  assert.ok(TRANSITIONS.MOI.includes('DA_PHAN_CONG'));
  assert.ok(!TRANSITIONS.DANG_XU_LY.includes('MOI'));
  assert.ok(!TRANSITIONS.DANG_XU_LY.includes('DA_PHAN_CONG'));
});

test('QT03: trạng thái cuối DA_DONG và DA_HUY không chuyển đi đâu nữa', () => {
  assert.deepEqual(TRANSITIONS.DA_DONG, []);
  assert.deepEqual(TRANSITIONS.DA_HUY, []);
});
