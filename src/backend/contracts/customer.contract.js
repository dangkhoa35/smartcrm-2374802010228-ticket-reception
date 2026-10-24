// ============================================================================
// HỢP ĐỒNG: Khách hàng và Thiết bị trả ra từ lớp nghiệp vụ cho lớp API / giao diện.
// Nơi DUY NHẤT biết cột bảng `customer`, `device` -> tên trường trả cho client.
//
// toCustomerView:
//   customer_id : số nguyên, luôn có
//   full_name   : chuỗi, luôn có
//   phone       : chuỗi 10 số, CHE (090****567) trừ vai trò QUAN_LY_TRUNG_TAM (NFR2)
//   email       : chuỗi HOẶC null nếu chưa có
//   address     : chuỗi HOẶC null nếu chưa có
//
// toDeviceView:
//   device_id       : số nguyên, luôn có
//   product_name    : chuỗi, luôn có
//   serial_no       : chuỗi, luôn có
//   purchase_date   : chuỗi YYYY-MM-DD HOẶC null nếu CHƯA CÓ ngày mua
//                     (null = chưa xác minh được, QT01 coi là hết bảo hành, cần Quản lý duyệt)
//   warranty_months : số nguyên >= 0, đơn vị THÁNG
//
// KHI SAI: không có khách -> service ném 404 KHONG_TIM_THAY;
//          trùng số điện thoại khi tạo -> 409 SDT_DA_TON_TAI;
//          khách chưa có thiết bị -> mảng rỗng [] (KHÔNG phải lỗi).
// ============================================================================
const { maskPhone } = require('../utils/phone');

// pg trả cột DATE thành Date theo giờ máy chủ; lấy ngày theo giờ địa phương để không lệch ngày.
function toDateOnly(d) {
  if (d == null) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function toCustomerView(r, actor) {
  return {
    customer_id: r.customer_id,
    full_name: r.full_name,
    phone: actor.role === 'QUAN_LY_TRUNG_TAM' ? r.phone : maskPhone(r.phone),
    email: r.email ?? null,
    address: r.address ?? null,
  };
}

function toDeviceView(r) {
  return {
    device_id: r.device_id,
    product_name: r.product_name,
    serial_no: r.serial_no,
    purchase_date: toDateOnly(r.purchase_date),
    warranty_months: r.warranty_months,
  };
}

module.exports = { toCustomerView, toDeviceView, toDateOnly };
