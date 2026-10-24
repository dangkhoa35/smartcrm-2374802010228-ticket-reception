import { CLOSED_STATUSES } from './labels';

const TZ = 'Asia/Ho_Chi_Minh';
const fmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ });

// API trả ISO 8601 UTC; giao diện đổi sang giờ Việt Nam khi hiển thị.
export function formatDateTime(iso) {
  return iso ? fmt.format(new Date(iso)) : '—';
}

export function formatDate(yyyyMmDd) {
  if (!yyyyMmDd) return '—';
  const [y, m, d] = yyyyMmDd.split('-');
  return `${d}/${m}/${y}`;
}

const HOUR = 3600 * 1000;

// Trạng thái hạn cam kết của một phiếu, để đánh dấu phiếu cần làm trước.
// overdue: quá hạn · soon: còn dưới 24 giờ · ok: còn hạn · none: phiếu đã xử lý xong.
export function dueState(ticket, now = Date.now()) {
  if (CLOSED_STATUSES.includes(ticket.status)) return { kind: 'none', text: '' };
  const diff = new Date(ticket.due_date).getTime() - now;
  const hours = Math.floor(Math.abs(diff) / HOUR);
  const span = hours >= 24 ? `${Math.floor(hours / 24)} ngày` : `${Math.max(hours, 1)} giờ`;
  if (diff < 0) return { kind: 'overdue', text: `Quá hạn ${span}` };
  if (diff < 24 * HOUR) return { kind: 'soon', text: `Còn ${span}` };
  return { kind: 'ok', text: `Còn ${span}` };
}

// Tình trạng bảo hành chỉ để HIỂN THỊ gợi ý lúc chọn thiết bị (QT01); máy chủ quyết định khi tạo phiếu.
export function warrantyHint(device, now = new Date()) {
  if (!device.purchase_date) return { kind: 'unknown', text: 'Chưa xác minh (thiếu ngày mua)' };
  const [y, m, d] = device.purchase_date.split('-').map(Number);
  const end = new Date(y, m - 1 + device.warranty_months, d);
  return end >= now
    ? { kind: 'valid', text: 'Còn bảo hành' }
    : { kind: 'expired', text: 'Hết bảo hành' };
}
