const { pool } = require('../db/pool');

async function findById(deviceId) {
  const { rows } = await pool.query('SELECT * FROM device WHERE device_id = $1', [deviceId]);
  return rows[0] || null;
}

// EP3: thiết bị của một khách hàng, sắp theo tên sản phẩm rồi mã.
async function listByCustomer(customerId) {
  const { rows } = await pool.query(
    'SELECT * FROM device WHERE customer_id = $1 ORDER BY product_name, device_id',
    [customerId]);
  return rows;
}

module.exports = { findById, listByCustomer };
