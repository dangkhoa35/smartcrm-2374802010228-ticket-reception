const router = require('express').Router();
const AppError = require('../utils/AppError');
const requireRole = require('../middlewares/requireRole');
const ticketService = require('../services/ticket.service');

const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const STATUSES = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY'];
const ACCESSORIES = ['SAC', 'TAI_NGHE', 'HOP', 'KHAC'];

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isPosInt = (v) => Number.isInteger(v) && v > 0;

function invalid(errors) {
  return new AppError(400, 'DU_LIEU_KHONG_HOP_LE', 'Dữ liệu gửi lên không hợp lệ', errors);
}

function parseId(raw) {
  const id = Number(raw);
  if (!isPosInt(id)) throw invalid([{ field: 'id', message: 'phải là số nguyên dương' }]);
  return id;
}

function validateCreate(body = {}) {
  const errors = [];
  if (!isPosInt(body.customer_id)) errors.push({ field: 'customer_id', message: 'bắt buộc, số nguyên dương' });
  if (!isPosInt(body.device_id)) errors.push({ field: 'device_id', message: 'bắt buộc, số nguyên dương' });

  const desc = typeof body.issue_desc === 'string' ? body.issue_desc.trim() : '';
  if (desc.length < 10 || desc.length > 2000) {
    errors.push({ field: 'issue_desc', message: 'bắt buộc, dài 10–2000 ký tự' });
  }
  if (body.priority != null && !PRIORITIES.includes(body.priority)) {
    errors.push({ field: 'priority', message: `phải thuộc ${PRIORITIES.join(', ')}` });
  }
  if (body.category_id != null && !isPosInt(body.category_id)) {
    errors.push({ field: 'category_id', message: 'phải là số nguyên dương' });
  }
  if (body.approved_by != null && !isPosInt(body.approved_by)) {
    errors.push({ field: 'approved_by', message: 'phải là số nguyên dương' });
  }
  const acc = body.accessories == null ? [] : body.accessories;
  if (!Array.isArray(acc) || acc.some((a) => !ACCESSORIES.includes(a))) {
    errors.push({ field: 'accessories', message: `mảng con của ${ACCESSORIES.join(', ')}` });
  }
  if (errors.length) throw invalid(errors);

  return {
    customer_id: body.customer_id,
    device_id: body.device_id,
    issue_desc: desc,
    priority: body.priority || null,
    category_id: body.category_id || null,
    approved_by: body.approved_by || null,
    accessories: acc,
  };
}

// POST /api/tickets – tạo phiếu (UC2). Header Idempotency-Key tùy chọn (NFR3).
router.post('/', requireRole('NHAN_VIEN_TIEP_NHAN'), wrap(async (req, res) => {
  const input = validateCreate(req.body);
  const { ticket, created } = await ticketService.createTicket(input, req.actor, req.get('Idempotency-Key'));
  res.status(created ? 201 : 200).json({ data: ticket });
}));

// GET /api/tickets?status=MOI&page=1&size=20 – danh sách theo Hạn cam kết tăng dần (UC5)
router.get('/', wrap(async (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const size = req.query.size === undefined ? 20 : Number(req.query.size);
  const errors = [];
  if (!isPosInt(page)) errors.push({ field: 'page', message: 'phải là số nguyên dương' });
  if (!isPosInt(size) || size > 100) errors.push({ field: 'size', message: 'từ 1 đến 100' });
  if (req.query.status !== undefined && !STATUSES.includes(req.query.status)) {
    errors.push({ field: 'status', message: `phải thuộc ${STATUSES.join(', ')}` });
  }
  if (errors.length) throw invalid(errors);

  res.json(await ticketService.listTickets({ status: req.query.status, page, size }, req.actor));
}));

// GET /api/tickets/:id – chi tiết
router.get('/:id', wrap(async (req, res) => {
  res.json({ data: await ticketService.getTicket(parseId(req.params.id), req.actor) });
}));

// PATCH /api/tickets/:id/status – chuyển trạng thái (UC6, chỉ Kỹ thuật viên)
router.patch('/:id/status', requireRole('KY_THUAT_VIEN'), wrap(async (req, res) => {
  const body = req.body || {};
  if (!STATUSES.includes(body.to_status)) {
    throw invalid([{ field: 'to_status', message: `phải thuộc ${STATUSES.join(', ')}` }]);
  }
  if (body.note != null && (typeof body.note !== 'string' || body.note.length > 255)) {
    throw invalid([{ field: 'note', message: 'chuỗi tối đa 255 ký tự' }]);
  }
  const data = await ticketService.changeStatus(parseId(req.params.id), body, req.actor);
  res.json({ data });
}));

module.exports = router;
