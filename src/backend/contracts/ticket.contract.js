// ============================================================================
// HỢP ĐỒNG: một Phiếu bảo hành trả ra từ lớp nghiệp vụ cho lớp API / giao diện.
// Đây là NƠI DUY NHẤT biết cột của bảng `ticket` -> tên trường trả cho client.
// Đổi tên cột trong CSDL chỉ phải sửa hàm toTicketView() này.
//
// HÌNH DẠNG (luôn có, trừ khi ghi khác):
//   ticket_id, customer_id, device_id, center_id : số nguyên
//   ticket_code    : chuỗi dạng BH-000123/2026
//   issue_desc     : chuỗi 10–2000 ký tự
//   priority       : 'CAO' | 'TRUNG_BINH' | 'THAP'
//   status         : 'MOI' | 'DA_PHAN_CONG' | 'DANG_XU_LY' | 'CHO_LINH_KIEN' | 'HOAN_TAT' | 'DA_DONG' | 'DA_HUY'
//   received_at    : chuỗi ISO 8601 UTC (hậu tố Z)
//   due_date       : chuỗi ISO 8601 UTC — Hạn cam kết (QT02), máy chủ tính
//   closed_at      : chuỗi ISO 8601 UTC HOẶC null nếu phiếu chưa đóng
//   is_warranty    : boolean (QT01)
//   technician_id  : số nguyên HOẶC null nếu chưa phân công
//   category_id    : số nguyên HOẶC null nếu chưa phân loại
//   accessories    : mảng con của ['SAC','TAI_NGHE','HOP','KHAC'], có thể rỗng
//   -- Chỉ có khi lấy từ truy vấn nối (danh sách / chi tiết):
//   customer_name, product_name, serial_no : chuỗi
//   customer_phone : chuỗi; CHE (090****567) trừ vai trò QUAN_LY_TRUNG_TAM (NFR2)
//   category_name  : chuỗi HOẶC null nếu chưa phân loại
//
// Ý NGHĨA ĐẶC BIỆT:
//   null ở technician_id = chưa phân công (KHÔNG phải lỗi, KHÔNG phải 0).
//   null ở closed_at     = phiếu còn mở.
//
// KHI SAI: không tìm thấy phiếu (hoặc phiếu của trung tâm khác) -> service ném
//   AppError 404 KHONG_TIM_THAY; lớp API trả { error, message }.
// ============================================================================
const { maskPhone } = require('../utils/phone');

const toIso = (d) => (d == null ? null : new Date(d).toISOString());

function toTicketView(r, actor) {
  const view = {
    ticket_id: r.ticket_id,
    ticket_code: r.ticket_code,
    customer_id: r.customer_id,
    device_id: r.device_id,
    category_id: r.category_id ?? null,
    center_id: r.center_id,
    issue_desc: r.issue_desc,
    priority: r.priority,
    status: r.status,
    received_at: toIso(r.received_at),
    due_date: toIso(r.due_date),
    closed_at: toIso(r.closed_at),
    is_warranty: r.is_warranty,
    technician_id: r.technician_id ?? null,
    accessories: [
      r.acc_sac && 'SAC', r.acc_tai_nghe && 'TAI_NGHE', r.acc_hop && 'HOP', r.acc_khac && 'KHAC',
    ].filter(Boolean),
  };
  if (r.customer_name !== undefined) { // có khi lấy từ truy vấn nối
    view.customer_name = r.customer_name;
    view.customer_phone =
      actor.role === 'QUAN_LY_TRUNG_TAM' ? r.customer_phone : maskPhone(r.customer_phone);
    view.product_name = r.product_name;
    view.serial_no = r.serial_no;
    view.category_name = r.category_name ?? null;
  }
  return view;
}

module.exports = { toTicketView };