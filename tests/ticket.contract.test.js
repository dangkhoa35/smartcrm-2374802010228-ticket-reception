// Test hợp đồng ở ranh giới: kiểm tra HÌNH DẠNG và Ý NGHĨA ĐẶC BIỆT (null, định dạng ngày),
// không kiểm tra giá trị nghiệp vụ. Ai đổi tên trường thì test này vỡ NGAY trên máy.
const test = require('node:test');
const assert = require('node:assert/strict');
const { toTicketView } = require('../src/backend/contracts/ticket.contract');

const TIEP_NHAN = { role: 'NHAN_VIEN_TIEP_NHAN', employeeId: 1, centerId: 1 };
const QUAN_LY = { role: 'QUAN_LY_TRUNG_TAM', employeeId: 2, centerId: 1 };

// Hàng giống hệt kết quả pg trả về (Date thật, cột snake_case của bảng)
function hangMau(override = {}) {
  return {
    ticket_id: 7801, ticket_code: 'BH-007801/2026', customer_id: 34018, device_id: 63,
    category_id: 3, center_id: 1, issue_desc: 'Máy sạc không vào, cắm sạc không nhận.',
    priority: 'TRUNG_BINH', status: 'MOI',
    received_at: new Date('2026-10-20T10:37:19.199Z'),
    due_date: new Date('2026-10-23T10:37:19.199Z'),
    closed_at: null, is_warranty: true, technician_id: null,
    acc_sac: true, acc_tai_nghe: false, acc_hop: true, acc_khac: false,
    customer_name: 'Đỗ Đức Cường', customer_phone: '0781234918',
    product_name: 'Samsung Note 8', serial_no: 'SN928032948926', category_name: 'SAC',
    ...override,
  };
}

test('toTicketView trả đúng các trường của hợp đồng (luồng đúng)', () => {
  const v = toTicketView(hangMau(), TIEP_NHAN);
  assert.deepEqual(Object.keys(v).sort(), [
    'accessories', 'category_id', 'category_name', 'center_id', 'closed_at', 'customer_id',
    'customer_name', 'customer_phone', 'device_id', 'due_date', 'is_warranty', 'issue_desc',
    'priority', 'product_name', 'received_at', 'serial_no', 'status', 'technician_id',
    'ticket_code', 'ticket_id',
  ]);
  assert.deepEqual(v.accessories, ['SAC', 'HOP']);
});

test('thời gian là chuỗi ISO 8601 UTC, không phải đối tượng Date', () => {
  const v = toTicketView(hangMau(), TIEP_NHAN);
  assert.match(v.received_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.match(v.due_date, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(typeof v.due_date, 'string');
});

test('technician_id và closed_at là null (không phải undefined/0) khi chưa có (giá trị biên)', () => {
  const v = toTicketView(hangMau({ technician_id: undefined, closed_at: undefined }), TIEP_NHAN);
  assert.equal(v.technician_id, null);
  assert.equal(v.closed_at, null);
});

test('NFR2: che số điện thoại, trừ Quản lý trung tâm (dữ liệu sai/nhạy cảm)', () => {
  assert.equal(toTicketView(hangMau(), TIEP_NHAN).customer_phone, '078****918');
  assert.equal(toTicketView(hangMau(), QUAN_LY).customer_phone, '0781234918');
});

test('không lộ cột nội bộ của bảng ticket ra ngoài hợp đồng', () => {
  const v = toTicketView(hangMau({ idempotency_key: 'abc', approved_by: 5, is_active: true }), TIEP_NHAN);
  for (const k of ['idempotency_key', 'approved_by', 'is_active', 'acc_sac']) {
    assert.ok(!(k in v), `${k} không được nằm trong hợp đồng`);
  }
});
