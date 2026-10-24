const AppError = require('../utils/AppError');
const { toTicketView } = require('../contracts/ticket.contract');
const { computeDueDate } = require('../utils/dueDate');
const ticketRepo = require('../repositories/ticket.repository');
const deviceRepo = require('../repositories/device.repository');
const categoryRepo = require('../repositories/issueCategory.repository');

// QT03: vòng đời trạng thái, chỉ đi tới, không quay lại. Chỉnh cho khớp SRS của bạn nếu khác.
const TRANSITIONS = {
  MOI:           ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG:  ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY:    ['CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY'],
  CHO_LINH_KIEN: ['HOAN_TAT', 'DA_HUY'],
  HOAN_TAT:      ['DA_DONG'],
  DA_DONG:       [],
  DA_HUY:        [],
};

// QT01: còn bảo hành nếu ngày tiếp nhận <= ngày mua + số tháng bảo hành. Không có ngày mua -> không còn.
function isUnderWarranty(device, receivedAt) {
  if (!device.purchase_date) return false;
  const end = new Date(device.purchase_date);
  end.setMonth(end.getMonth() + device.warranty_months);
  return receivedAt <= end;
}

// UC2 – Tạo Phiếu bảo hành mới. `input` đã được lớp API kiểm kiểu dữ liệu.
async function createTicket(input, actor, idempotencyKey) {
  // NFR3: gửi lại cùng Idempotency-Key thì trả lại phiếu cũ, không tạo phiếu thứ hai
  if (idempotencyKey) {
    const existing = await ticketRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) return { ticket: toTicketView(existing, actor), created: false };
  }

  const device = await deviceRepo.findById(input.device_id);
  if (!device || device.customer_id !== input.customer_id) {
    throw new AppError(422, 'THIET_BI_KHONG_THUOC_KHACH_HANG',
      'Thiết bị không tồn tại hoặc không thuộc khách hàng này');
  }

  // QT03: một thiết bị chỉ có một phiếu chưa đóng (CSDL còn chặn lần cuối bằng UNIQUE một phần)
  const open = await ticketRepo.findOpenByDevice(device.device_id);
  if (open) {
    throw new AppError(409, 'THIET_BI_DANG_CO_PHIEU_MO',
      `Thiết bị đang có phiếu chưa đóng: ${open.ticket_code}`);
  }

  // QT01: hết bảo hành thì cần Quản lý trung tâm phê duyệt (approved_by)
  const receivedAt = new Date();
  const isWarranty = isUnderWarranty(device, receivedAt);
  if (!isWarranty && !input.approved_by) {
    throw new AppError(422, 'CAN_QUAN_LY_PHE_DUYET',
      'Thiết bị hết bảo hành hoặc không có ngày mua, cần Quản lý trung tâm phê duyệt');
  }

  // FR4 (rút gọn): ưu tiên do người dùng chọn, nếu không thì lấy mặc định của nhóm sự cố,
  // nếu không có nhóm thì TRUNG_BINH (luồng ngoại lệ 6a của UC2)
  let category = null;
  if (input.category_id) {
    category = await categoryRepo.findById(input.category_id);
    if (!category) {
      throw new AppError(422, 'NHOM_SU_CO_KHONG_TON_TAI', 'Nhóm sự cố không tồn tại');
    }
  }
  const priority = input.priority || (category && category.default_priority) || 'TRUNG_BINH';

  // QT02: Hạn cam kết
  const dueDate = computeDueDate(receivedAt, priority);

  try {
    const row = await ticketRepo.createWithInitialLog({
      customerId: input.customer_id,
      deviceId: input.device_id,
      categoryId: category ? category.category_id : null,
      centerId: actor.centerId,
      issueDesc: input.issue_desc,
      priority,
      receivedAt,
      dueDate,
      isWarranty,
      approvedBy: input.approved_by || null,
      accessories: {
        sac: input.accessories.includes('SAC'),
        tai_nghe: input.accessories.includes('TAI_NGHE'),
        hop: input.accessories.includes('HOP'),
        khac: input.accessories.includes('KHAC'),
      },
      idempotencyKey: idempotencyKey || null,
    }, actor.employeeId);
    return { ticket: toTicketView(row, actor), created: true };
  } catch (e) {
    // Hai yêu cầu đồng thời: CSDL chặn bằng UNIQUE, quy về cùng mã lỗi nghiệp vụ
    if (e.code === '23505' && e.constraint === 'uq_ticket_open_per_device') {
      throw new AppError(409, 'THIET_BI_DANG_CO_PHIEU_MO', 'Thiết bị đang có phiếu chưa đóng');
    }
    if (e.code === '23505' && e.constraint === 'ticket_idempotency_key_key') {
      const existing = await ticketRepo.findByIdempotencyKey(idempotencyKey);
      return { ticket: toTicketView(existing, actor), created: false };
    }
    throw e;
  }
}

// UC5 – danh sách theo Hạn cam kết, lọc trạng thái, phân trang (chỉ phiếu của trung tâm mình)
async function listTickets({ status, page, size }, actor) {
  const { rows, total } = await ticketRepo.list({ centerId: actor.centerId, status, page, size });
  return {
    data: rows.map((r) => toTicketView(r, actor)),
    paging: { page, size, total, total_pages: Math.ceil(total / size) },
  };
}

async function getTicket(ticketId, actor) {
  const row = await ticketRepo.findById(ticketId, actor.centerId);
  if (!row) throw new AppError(404, 'KHONG_TIM_THAY', 'Không tìm thấy phiếu bảo hành');
  return toTicketView(row, actor);
}

// UC6 – Chuyển trạng thái đúng vòng đời, ghi lịch sử (QT03)
async function changeStatus(ticketId, { to_status, note }, actor) {
  const current = await ticketRepo.findById(ticketId, actor.centerId);
  if (!current) throw new AppError(404, 'KHONG_TIM_THAY', 'Không tìm thấy phiếu bảo hành');

  if (!TRANSITIONS[current.status].includes(to_status)) {
    throw new AppError(422, 'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
      `Không được chuyển từ ${current.status} sang ${to_status}`);
  }
  const closedAt = ['DA_DONG', 'DA_HUY'].includes(to_status) ? new Date() : null;

  const updated = await ticketRepo.updateStatus({
    ticketId, fromStatus: current.status, toStatus: to_status,
    closedAt, actorId: actor.employeeId, note,
  });
  if (!updated) {
    throw new AppError(409, 'XUNG_DOT_TRANG_THAI', 'Trạng thái phiếu vừa được người khác thay đổi');
  }
  return getTicket(ticketId, actor);
}

module.exports = { createTicket, listTickets, getTicket, changeStatus, TRANSITIONS, isUnderWarranty };
