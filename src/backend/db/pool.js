require('dotenv').config({ quiet: true });
const { Pool, types } = require('pg');

// BIGINT (oid 20) mặc định trả về chuỗi; đổi sang số cho dễ dùng (id nhỏ, an toàn).
types.setTypeParser(20, (v) => parseInt(v, 10));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = { pool };
