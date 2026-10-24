const router = require('express').Router();
const issueCategoryService = require('../services/issueCategory.service');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// EP8: GET /api/issue-categories – mọi vai trò hợp lệ
router.get('/', wrap(async (req, res) => {
  res.json({ data: await issueCategoryService.list() });
}));

module.exports = router;
