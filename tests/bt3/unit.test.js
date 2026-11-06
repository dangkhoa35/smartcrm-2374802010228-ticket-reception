// BT3 – tầng UNIT (7 test): hàm thuần, KHÔNG CSDL, KHÔNG mạng.
// Kết quả mong đợi đều TÍNH TAY, không dùng chính hàm cần kiểm để tính kỳ vọng.
const test = require('node:test');
const assert = require('node:assert/strict');
const { isUnderWarranty } = require('../../src/backend/services/ticket.service');
const { computeDueDate } = require('../../src/backend/utils/dueDate');
const { createTicketSchema, parseOrThrow } = require('../../src/backend/validators/ticket.schema');

// pg trả cột DATE thành Date 00:00 giờ máy, nên dùng new Date(năm, tháng-1, ngày) cho giống thật
const mua = { purchase_date: new Date(2026, 2, 1), warranty_months: 12 }; // mua 01/03/2026, BH 12 tháng
const hopLe = { customer_id: 1, device_id: 1, issue_desc: 'Màn hình bị sọc ngang sau khi rơi' };

test('TC-01 QT01 luồng đúng: tiếp nhận 28/02/2027 (còn hạn) -> còn bảo hành', () => {
  assert.equal(isUnderWarranty(mua, new Date(2027, 1, 28, 9, 0)), true);
});

test('TC-02 QT02 luồng đúng: nhận thứ Sáu 06/11/2026 09:00, mức CAO -> hạn thứ Bảy 07/11/2026 09:00', () => {
  const han = computeDueDate(new Date('2026-11-06T09:00:00+07:00'), 'CAO');
  assert.equal(han.toISOString(), new Date('2026-11-07T09:00:00+07:00').toISOString());
});

test('TC-03 QT01 biên: tiếp nhận 09:00 đúng ngày 01/03/2027 (ngày cuối hạn) -> VẪN còn bảo hành', () => {
  assert.equal(isUnderWarranty(mua, new Date(2027, 2, 1, 9, 0)), true);
});

test('TC-04 QT01 biên: tiếp nhận 09:00 ngày 02/03/2027 (sau hạn 1 ngày) -> HẾT bảo hành', () => {
  assert.equal(isUnderWarranty(mua, new Date(2027, 2, 2, 9, 0)), false);
});

test('TC-05 QT02 biên: nhận thứ Bảy 07/11/2026 15:00, mức CAO -> bỏ qua Chủ nhật, hạn thứ Hai 09/11/2026 15:00', () => {
  const han = computeDueDate(new Date('2026-11-07T15:00:00+07:00'), 'CAO');
  assert.equal(han.toISOString(), new Date('2026-11-09T15:00:00+07:00').toISOString());
});

test('TC-06 dữ liệu sai: mô tả lỗi 9 ký tự -> 400, thông báo nêu "tối thiểu 10 ký tự"', () => {
  assert.throws(
    () => parseOrThrow(createTicketSchema, { ...hopLe, issue_desc: 'a'.repeat(9) }),
    (e) => e.status === 400 && e.code === 'DU_LIEU_KHONG_HOP_LE' && /tối thiểu 10 ký tự/.test(e.fields.issue_desc));
});

test('TC-07 dữ liệu sai: thiếu hẳn mô tả lỗi -> 400, thông báo nêu đúng trường issue_desc', () => {
  const { issue_desc, ...thieu } = hopLe;
  assert.throws(
    () => parseOrThrow(createTicketSchema, thieu),
    (e) => e.status === 400 && e.fields.issue_desc === 'Vui lòng mô tả lỗi');
});