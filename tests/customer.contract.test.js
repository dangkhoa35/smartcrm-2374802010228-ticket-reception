const test = require('node:test');
const assert = require('node:assert/strict');
const { toCustomerView, toDeviceView } = require('../src/backend/contracts/customer.contract');

const TIEP_NHAN = { role: 'NHAN_VIEN_TIEP_NHAN' };
const QUAN_LY = { role: 'QUAN_LY_TRUNG_TAM' };

test('toCustomerView trả đúng các trường của hợp đồng, che số điện thoại (luồng đúng)', () => {
  const v = toCustomerView({ customer_id: 5, full_name: 'Đỗ Đức Cường', phone: '0781234918',
    email: null, address: 'Cần Thơ', created_at: new Date(), is_active: true }, TIEP_NHAN);
  assert.deepEqual(Object.keys(v).sort(), ['address', 'customer_id', 'email', 'full_name', 'phone']);
  assert.equal(v.phone, '078****918');
  assert.equal(toCustomerView({ customer_id: 5, full_name: 'A', phone: '0781234918' }, QUAN_LY).phone, '0781234918');
});

test('email và address là null (không phải undefined) khi chưa có (giá trị biên)', () => {
  const v = toCustomerView({ customer_id: 5, full_name: 'A', phone: '0781234918' }, TIEP_NHAN);
  assert.equal(v.email, null);
  assert.equal(v.address, null);
});

test('toDeviceView: purchase_date là YYYY-MM-DD không lệch ngày; null khi chưa có ngày mua', () => {
  const v = toDeviceView({ device_id: 1, customer_id: 9, serial_no: 'SN1', product_name: 'Note 8',
    purchase_date: new Date(2026, 2, 10), warranty_months: 12 });
  assert.deepEqual(Object.keys(v).sort(), ['device_id', 'product_name', 'purchase_date', 'serial_no', 'warranty_months']);
  assert.equal(v.purchase_date, '2026-03-10');
  assert.equal(toDeviceView({ device_id: 1, serial_no: 'S', product_name: 'P', purchase_date: null, warranty_months: 12 }).purchase_date, null);
});
