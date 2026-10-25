const { pool } = require('../db/pool');

// Dùng để kiểm tra người phê duyệt (approved_by) có thật, đúng vai trò, đúng trung tâm (SRS 8a).
async function findById(employeeId) {
  const { rows } = await pool.query(
    'SELECT employee_id, full_name, role, center_id FROM employee WHERE employee_id = $1',
    [employeeId]);
  return rows[0] || null;
}

module.exports = { findById };
