const { pool } = require('../db/pool');

async function listAll() {
  const { rows } = await pool.query(
    'SELECT center_id, center_code, center_name, city FROM service_center ORDER BY center_id');
  return rows;
}

async function findById(centerId) {
  const { rows } = await pool.query(
    'SELECT center_id, center_code, center_name, city FROM service_center WHERE center_id = $1', [centerId]);
  return rows[0] || null;
}

module.exports = { listAll, findById };
