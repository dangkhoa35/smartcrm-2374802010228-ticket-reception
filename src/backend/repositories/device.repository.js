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

// EP9: thêm thiết bị cho khách hàng. Trùng số serial -> pg ném 23505 (service đổi thành 409).
async function create({ customerId, productName, serialNo, purchaseDate, warrantyMonths }) {
  const { rows } = await pool.query(
    `INSERT INTO device (customer_id, product_name, serial_no, purchase_date, warranty_months)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [customerId, productName, serialNo, purchaseDate, warrantyMonths]);
  return rows[0];
}

module.exports = { findById, listByCustomer, create };
