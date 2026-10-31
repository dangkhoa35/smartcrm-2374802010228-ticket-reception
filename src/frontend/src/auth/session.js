// Phiên làm việc sau khi đăng nhập: { token, expiresAt, role, employeeId, centerId, fullName, username }.
// token do máy chủ ký (JWT, hết hạn sau 30 phút). Vai trò trong phiên chỉ để HIỂN THỊ giao diện;
// máy chủ luôn tự kiểm quyền từ token nên sửa localStorage không nâng được quyền.
// Hạn chế đã ghi nhận: token lưu trong localStorage (XSS đọc được); hướng cải tiến là cookie httpOnly.
const KEY = 'smartcrm.session';

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.role) return null;
    // Hết hạn thì coi như chưa đăng nhập (máy chủ cũng từ chối token hết hạn bằng 401)
    if (s.expiresAt && new Date(s.expiresAt).getTime() <= Date.now()) { localStorage.removeItem(KEY); return null; }
    return s;
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
