// Nhãn tiếng Việt cho các mã trong hợp đồng API. Người dùng không bao giờ thấy mã thô.
export const STATUS_LABEL = {
  MOI: 'Mới', DA_PHAN_CONG: 'Đã phân công', DANG_XU_LY: 'Đang xử lý',
  CHO_LINH_KIEN: 'Chờ linh kiện', HOAN_TAT: 'Hoàn tất', DA_DONG: 'Đã đóng', DA_HUY: 'Đã hủy',
};
export const PRIORITY_LABEL = { CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' };
export const ACCESSORY_LABEL = { SAC: 'Sạc', TAI_NGHE: 'Tai nghe', HOP: 'Hộp', KHAC: 'Khác' };
export const CATEGORY_LABEL = {
  MAN_HINH: 'Màn hình', PIN: 'Pin', SAC: 'Sạc', PHAN_MEM: 'Phần mềm', NUOC_VAO: 'Nước vào', KHAC: 'Khác',
};
export const ROLE_LABEL = {
  NHAN_VIEN_TIEP_NHAN: 'Nhân viên tiếp nhận',
  QUAN_LY_TRUNG_TAM: 'Quản lý trung tâm',
  KY_THUAT_VIEN: 'Kỹ thuật viên',
};
export const ROLES = Object.keys(ROLE_LABEL);
export const STATUSES = Object.keys(STATUS_LABEL);

// Vòng đời hiển thị cho ô chọn (QT03). Máy chủ mới là nơi quyết định; sai thì máy chủ trả 422.
export const NEXT_STATUS = {
  MOI: ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY: ['CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY'],
  CHO_LINH_KIEN: ['HOAN_TAT', 'DA_HUY'],
  HOAN_TAT: ['DA_DONG'],
  DA_DONG: [],
  DA_HUY: [],
};
export const CLOSED_STATUSES = ['HOAN_TAT', 'DA_DONG', 'DA_HUY'];

export const label = (map, code) => map[code] ?? code;
