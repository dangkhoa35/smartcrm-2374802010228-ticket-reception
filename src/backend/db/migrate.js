// Chạy: npm run migrate
// Chạy lần lượt các file trong db/migrations/*.sql theo thứ tự tên.
// Bảng schema_migrations ghi file đã chạy nên chạy lại không báo "already exists".
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   VARCHAR(200) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const done = new Set(
    (await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename)
  );

  for (const f of files) {
    if (done.has(f)) { console.log('bỏ qua  ', f); continue; }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [f]);
      await client.query('COMMIT');
      console.log('đã chạy ', f);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('LỖI     ', f, '-', e.message);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

run();
