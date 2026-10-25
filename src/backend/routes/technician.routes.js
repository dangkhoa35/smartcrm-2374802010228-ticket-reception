const router = require('express').Router();
const requireRole = require('../middlewares/requireRole');
const technicianService = require('../services/technician.service');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// EP10: GET /api/technicians – chỉ Kỹ thuật viên và Quản lý (người phân công)
router.get('/', requireRole('KY_THUAT_VIEN', 'QUAN_LY_TRUNG_TAM'), wrap(async (req, res) => {
  res.json({ data: await technicianService.listForCenter(req.actor) });
}));

module.exports = router;
