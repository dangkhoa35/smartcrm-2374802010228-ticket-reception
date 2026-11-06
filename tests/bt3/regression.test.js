// BT3 – test HỒI QUY: mỗi bug đã sửa có một test bảo đảm nó không quay lại.
const test = require('node:test');
const assert = require('node:assert/strict');
const { isUnderWarranty } = require('../../src/backend/services/ticket.service');

test('TC-13 hồi quy BUG-004 QT01: mua 31/08/2026 + 6 tháng, hạn là 28/02/2027 (không tràn sang tháng 3)', () => {
  const tb = { purchase_date: new Date(2026, 7, 31), warranty_months: 6 };
  assert.equal(isUnderWarranty(tb, new Date(2027, 1, 28, 9, 0)), true);   // đúng ngày hạn: còn
  assert.equal(isUnderWarranty(tb, new Date(2027, 2, 2, 9, 0)), false);   // 02/03/2027: hết
});