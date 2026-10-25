const router = require('express').Router();

router.use('/tickets', require('./ticket.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/issue-categories', require('./issueCategory.routes'));
router.use('/technicians', require('./technician.routes'));

module.exports = router;
