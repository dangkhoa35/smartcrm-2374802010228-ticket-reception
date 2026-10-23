const { pool } = require('../db/pool');

async function findById(deviceId) {
  const { rows } = await pool.query('SELECT * FROM device WHERE device_id = $1', [deviceId]);
  return rows[0] || null;
}

module.exports = { findById };
