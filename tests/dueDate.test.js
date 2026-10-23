// Chạy: npm test   (dùng bộ chạy test có sẵn của Node.js 18+, không cần cài thêm)
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeDueDate } = require('../src/backend/utils/dueDate');

// Lưu ý: tháng trong new Date(năm, tháng, ngày) tính từ 0, nên 9 = tháng 10.
// 19/10/2026 là thứ Hai.
const day = (d) => d.getDate();

test('QT02: ưu tiên CAO = 1 ngày làm việc (thứ Hai -> thứ Ba)', () => {
  const due = computeDueDate(new Date(2026, 9, 19, 9, 0), 'CAO');
  assert.equal(day(due), 20);
  assert.equal(due.getDay(), 2);
});

test('QT02: bỏ qua Chủ nhật (thứ Bảy 24/10 + CAO -> thứ Hai 26/10)', () => {
  const due = computeDueDate(new Date(2026, 9, 24, 9, 0), 'CAO');
  assert.equal(day(due), 26);
  assert.equal(due.getDay(), 1);
});

test('QT02: TRUNG_BINH = 3 ngày làm việc (thứ Hai 19/10 -> thứ Năm 22/10)', () => {
  assert.equal(day(computeDueDate(new Date(2026, 9, 19, 9, 0), 'TRUNG_BINH')), 22);
});

test('QT02: TRUNG_BINH từ thứ Sáu 23/10 đi qua Chủ nhật -> thứ Ba 27/10', () => {
  assert.equal(day(computeDueDate(new Date(2026, 9, 23, 9, 0), 'TRUNG_BINH')), 27);
});

test('QT02: THAP = 5 ngày làm việc (thứ Ba 20/10 -> thứ Hai 26/10)', () => {
  assert.equal(day(computeDueDate(new Date(2026, 9, 20, 9, 0), 'THAP')), 26);
});

test('QT02: giữ nguyên giờ tiếp nhận và không sửa ngày đầu vào', () => {
  const from = new Date(2026, 9, 19, 9, 30);
  const due = computeDueDate(from, 'CAO');
  assert.equal(due.getHours(), 9);
  assert.equal(due.getMinutes(), 30);
  assert.equal(from.getDate(), 19);
});

test('mức ưu tiên không hợp lệ thì báo lỗi', () => {
  assert.throws(() => computeDueDate(new Date(), 'KHAN_CAP'));
});
