const { pool } = require('../db/pool');

async function findById(categoryId) {
  const { rows } = await pool.query(
    'SELECT * FROM issue_category WHERE category_id = $1 AND is_active = TRUE',
    [categoryId]
  );
  return rows[0] || null;
}

module.exports = { findById };
