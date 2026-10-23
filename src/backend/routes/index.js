const router = require('express').Router();

router.use('/tickets', require('./ticket.routes'));
// Entity thứ hai (customer) sẽ thêm ở phần tự học: router.use('/customers', require('./customer.routes'));

module.exports = router;
