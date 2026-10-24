// Phiên làm việc tạm thời (Sprint 2): chọn vai trò, mã nhân viên, trung tâm; backend đọc từ 3 header x-*.
// Hạn chế đã ghi nhận: lưu trong localStorage, không có mật khẩu, chưa phải đăng nhập thật.
// Thiết kế đích: JWT Bearer (api-contract mục 1.1) sẽ thay thế module này.
const KEY = 'smartcrm.session';

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.role ? s : null;
  } catch {
    return null; // dữ liệu hỏng coi như chưa đăng nhập
  }
}
export function saveSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}
export function clearSession() {
  localStorage.removeItem(KEY);
}
