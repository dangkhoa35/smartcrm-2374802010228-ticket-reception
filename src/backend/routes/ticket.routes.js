const router = require('express').Router();
const requireRole = require('../middlewares/requireRole');
const ticketService = require('../services/ticket.service');
const {
  createTicketSchema, listQuerySchema, changeStatusSchema, idParamSchema, parseOrThrow,
} = require('../validators/ticket.schema');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Lớp API chỉ làm 3 việc: kiểm tra đầu vào (validators), gọi service, trả JSON.

// POST /api/tickets – tạo phiếu (UC2). Header Idempotency-Key tùy chọn (NFR3).
router.post('/', requireRole('NHAN_VIEN_TIEP_NHAN'), wrap(async (req, res) => {
  const b = parseOrThrow(createTicketSchema, req.body);
  const input = {
    customer_id: b.customer_id,
    device_id: b.device_id,
    issue_desc: b.issue_desc,
    priority: b.priority || null,
    category_id: b.category_id || null,
    approved_by: b.approved_by || null,
    accessories: b.accessories || [],
  };
  const { ticket, created } = await ticketService.createTicket(input, req.actor, req.get('Idempotency-Key'));
  res.status(created ? 201 : 200).json({ data: ticket });
}));

// GET /api/tickets?status=MOI&page=1&size=20 – danh sách theo Hạn cam kết tăng dần (UC5)
router.get('/', wrap(async (req, res) => {
  const q = parseOrThrow(listQuerySchema, req.query);
  res.json(await ticketService.listTickets({ status: q.status, page: q.page, size: q.size }, req.actor));
}));

// GET /api/tickets/:id – chi tiết
router.get('/:id', wrap(async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json({ data: await ticketService.getTicket(id, req.actor) });
}));

// PATCH /api/tickets/:id/status – chuyển trạng thái (UC6, chỉ Kỹ thuật viên)
router.patch('/:id/status', requireRole('KY_THUAT_VIEN'), wrap(async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const body = parseOrThrow(changeStatusSchema, req.body);
  res.json({ data: await ticketService.changeStatus(id, { to_status: body.to_status, note: body.note || undefined }, req.actor) });
}));

module.exports = router;
