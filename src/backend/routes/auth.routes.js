// Nhóm xác thực: CÔNG KHAI (không cần token), gắn trước middleware actor trong app.js.
const router = require('express').Router();
const authService = require('../services/auth.service');
const { parseOrThrow } = require('../validators/parse');
const { loginSchema, registerSchema } = require('../validators/auth.schema');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// EP11: POST /api/auth/login
router.post('/login', wrap(async (req, res) => {
  const input = parseOrThrow(loginSchema, req.body);
  res.json({ data: await authService.login(input) });
}));

// EP12: POST /api/auth/register
router.post('/register', wrap(async (req, res) => {
  const input = parseOrThrow(registerSchema, req.body);
  res.status(201).json({ data: await authService.register(input) });
}));

// EP13: GET /api/auth/centers
router.get('/centers', wrap(async (req, res) => {
  res.json({ data: await authService.listCenters() });
}));

module.exports = router;
