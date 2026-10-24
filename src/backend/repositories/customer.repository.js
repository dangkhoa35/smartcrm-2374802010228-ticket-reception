const { pool } = require('../db/pool');

async function findByPhone(phone) {
  const { rows } = await pool.query(
    'SELECT * FROM customer WHERE phone = $1 AND is_active = TRUE', [phone]);
  return rows[0] || null;
}

async function findById(customerId) {
  const { rows } = await pool.query(
    'SELECT * FROM customer WHERE customer_id = $1 AND is_active = TRUE', [customerId]);
  return rows[0] || null;
}

async function create({ fullName, phone, email, address }) {
  const { rows } = await pool.query(
    `INSERT INTO customer (phone, full_name, email, address)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [phone, fullName, email, address]);
  return rows[0];
}

module.exports = { findByPhone, findById, create };
