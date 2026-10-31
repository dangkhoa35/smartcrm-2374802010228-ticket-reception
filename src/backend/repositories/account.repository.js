const { pool } = require('../db/pool');

const COLS = 'employee_id, full_name, role, center_id, username, password_hash, is_active';

async function findByUsername(username) {
  const { rows } = await pool.query(`SELECT ${COLS} FROM employee WHERE username = $1`, [username]);
  return rows[0] || null;
}

// Trùng username -> CSDL ném lỗi 23505 (UNIQUE); service quy về 409
async function createAccount({ fullName, username, passwordHash, role, centerId }) {
  const { rows } = await pool.query(
    `INSERT INTO employee (full_name, role, center_id, username, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLS}`,
    [fullName, role, centerId, username, passwordHash]);
  return rows[0];
}

module.exports = { findByUsername, createAccount };
