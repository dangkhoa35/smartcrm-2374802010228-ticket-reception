const router = require('express').Router();
const requireRole = require('../middlewares/requireRole');
const customerService = require('../services/customer.service');
const { parseOrThrow } = require('../validators/parse');
const {
  lookupCustomerQuerySchema, createCustomerSchema, customerIdParamSchema, createDeviceSchema,
} = require('../validators/customer.schema');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Các endpoint khách hàng chỉ dành cho Nhân viên tiếp nhận (api-contract mục 1.3).
router.use(requireRole('NHAN_VIEN_TIEP_NHAN'));

// EP1: GET /api/customers?phone=0901234567
router.get('/', wrap(async (req, res) => {
  const { phone } = parseOrThrow(lookupCustomerQuerySchema, req.query);
  res.json({ data: await customerService.lookupByPhone(phone, req.actor) });
}));

// EP2: POST /api/customers
router.post('/', wrap(async (req, res) => {
  const input = parseOrThrow(createCustomerSchema, req.body);
  res.status(201).json({ data: await customerService.createCustomer(input, req.actor) });
}));

// EP3: GET /api/customers/:customer_id/devices
router.get('/:customer_id/devices', wrap(async (req, res) => {
  const { customer_id } = parseOrThrow(customerIdParamSchema, req.params);
  res.json({ data: await customerService.listDevices(customer_id) });
}));

// EP9: POST /api/customers/:customer_id/devices – thêm thiết bị cho khách hàng
router.post('/:customer_id/devices', wrap(async (req, res) => {
  const { customer_id } = parseOrThrow(customerIdParamSchema, req.params);
  const input = parseOrThrow(createDeviceSchema, req.body);
  res.status(201).json({ data: await customerService.createDevice(customer_id, input) });
}));

module.exports = router;
