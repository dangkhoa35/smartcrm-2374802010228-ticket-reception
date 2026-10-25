const { pool } = require('../db/pool');

async function findById(technicianId) {
  const { rows } = await pool.query(
    'SELECT technician_id, technician_code, full_name, center_id, level, is_active FROM technician WHERE technician_id = $1',
    [technicianId]);
  return rows[0] || null;
}

// EP10: kỹ thuật viên đang hoạt động của một trung tâm, để chọn khi phân công.
async function listActiveByCenter(centerId) {
  const { rows } = await pool.query(
    `SELECT technician_id, technician_code, full_name, level
       FROM technician WHERE center_id = $1 AND is_active = TRUE
      ORDER BY full_name, technician_id`,
    [centerId]);
  return rows;
}

module.exports = { findById, listActiveByCenter };
