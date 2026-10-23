// QT02: Hạn cam kết tính từ lúc tiếp nhận theo Mức ưu tiên,
// CAO = 24 giờ, TRUNG_BINH = 72 giờ, THAP = 120 giờ, chỉ tính thứ Hai đến thứ Bảy
// (bỏ qua Chủ nhật). Quy ra số ngày: 1, 3, 5 ngày làm việc.
const DAYS_BY_PRIORITY = { CAO: 1, TRUNG_BINH: 3, THAP: 5 };

function computeDueDate(from, priority) {
  let left = DAYS_BY_PRIORITY[priority];
  if (!left) throw new Error('Mức ưu tiên không hợp lệ: ' + priority);
  const due = new Date(from);
  while (left > 0) {
    due.setDate(due.getDate() + 1);
    if (due.getDay() !== 0) left--; // 0 = Chủ nhật, không tính
  }
  return due;
}

module.exports = { computeDueDate };
