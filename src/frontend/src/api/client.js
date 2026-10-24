// LỚP GỌI API – nơi DUY NHẤT biết về HTTP. Component không bao giờ gọi fetch trực tiếp.
import { clearSession, getSession } from '../auth/session';

const BASE = import.meta.env.VITE_API_BASE_URL; // KHÔNG ghi cứng địa chỉ; xem .env.example

export class ApiError extends Error {
  constructor(status, code, message, fields = null) {
    super(message);
    this.status = status; // mã HTTP; 0 = không tới được máy chủ
    this.code = code;     // mã lỗi máy đọc được (api-contract mục 1.2)
    this.fields = fields; // { ten_truong: 'thông báo' } khi lỗi 400
  }
  // Chỉ thử lại được khi lỗi tạm thời: mất kết nối hoặc máy chủ gặp sự cố.
  get retryable() { return this.status === 0 || this.status >= 500; }
}

// Trả về TOÀN BỘ phần thân phản hồi ({data} hoặc {data, paging}); các hàm trong *.api.js chọn phần cần dùng.
export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  if (!BASE) {
    throw new ApiError(0, 'CAU_HINH', 'Chưa cấu hình địa chỉ máy chủ (VITE_API_BASE_URL). Xem file .env.example.');
  }
  const session = getSession();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? {
          'x-role': session.role,
          'x-employee-id': String(session.employeeId),
          'x-center-id': String(session.centerId),
        } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch ném TypeError khi mất mạng hoặc máy chủ tắt: dịch thành câu cho người dùng, không lộ "Failed to fetch".
    throw new ApiError(0, 'KHONG_KET_NOI',
      'Không kết nối được tới hệ thống. Kiểm tra mạng và bảo đảm máy chủ đang chạy, rồi bấm Thử lại.');
  }

  let json = null;
  try { json = await res.json(); } catch { /* phản hồi không phải JSON */ }

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(
      res.status,
      json?.error ?? 'LOI_KHONG_RO',
      json?.message ?? 'Hệ thống đang gặp sự cố. Vui lòng thử lại.',
      json?.fields ?? null,
    );
  }
  return json;
}
