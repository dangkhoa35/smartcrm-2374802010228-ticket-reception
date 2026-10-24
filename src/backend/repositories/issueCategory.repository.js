const { pool } = require('../db/pool');

async function findById(categoryId) {
  const { rows } = await pool.query(
    'SELECT * FROM issue_category WHERE category_id = $1 AND is_active = TRUE',
    [categoryId]
  );
  return rows[0] || null;
}

// Danh mục cho ô chọn "Nhóm sự cố" trên giao diện.
async function listActive() {
  const { rows } = await pool.query(
    'SELECT category_id, category_name, default_priority FROM issue_category WHERE is_active = TRUE ORDER BY category_id');
  return rows;
}

module.exports = { findById, listActive };
