// ============================================================================
// Hạ tầng test có CSDL thật (BT3: integration + API). KHÔNG chạm vào CSDL phát triển.
//  - Dùng CSDL RIÊNG tên kết thúc bằng "_test" (mặc định smartcrm_test), tự tạo nếu chưa có.
//  - Thứ tự ưu tiên chọn kết nối: TEST_DATABASE_URL  >  DB_USER/DB_PASSWORD/DB_HOST_PORT trong .env
//  - Phải được require ĐẦU TIÊN trong mỗi file test (đặt DATABASE_URL trước khi nạp pool).
// ============================================================================
require('dotenv').config({ quiet: true });
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..', '..');

function testUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const { DB_USER, DB_PASSWORD, DB_HOST_PORT } = process.env;
  if (!DB_USER || !DB_PASSWORD) {
    throw new Error('Thiếu cấu hình CSDL test: đặt TEST_DATABASE_URL, hoặc có .env với DB_USER/DB_PASSWORD (xem .env.example).');
  }
  return `postgresql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@localhost:${DB_HOST_PORT || 5433}/smartcrm_test`;
}

const TEST_URL = testUrl();
const dbName = new URL(TEST_URL).pathname.slice(1);
if (!/_test$/.test(dbName)) {
  throw new Error(`Từ chối chạy: tên CSDL test phải kết thúc bằng "_test" (đang là "${dbName}") để không xoá nhầm dữ liệu thật.`);
}

// Phải đặt TRƯỚC khi nạp src/backend/db/pool.js (pool đọc DATABASE_URL lúc khởi tạo)
process.env.DATABASE_URL = TEST_URL;
process.env.LOG_LEVEL = 'error';                                   // test không cần log INFO
process.env.JWT_SECRET ||= crypto.randomBytes(24).toString('hex'); // khoá ngẫu nhiên mỗi lần chạy, không nằm trong repo
process.env.REGISTER_CODE_KY_THUAT_VIEN = 'ma-dang-ky-chi-de-test';

const DATASET_DIR = path.join(ROOT, 'data', 'sample');

function chay(script) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'src', 'backend', 'db', script)], {
    env: { ...process.env, DATABASE_URL: TEST_URL, DATASET_DIR }, encoding: 'utf8',
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

// Tạo CSDL test nếu chưa có, rồi migrate + seed danh mục. Chạy MỘT lần mỗi file test.
async function prepareDb() {
  const adminUrl = new URL(TEST_URL);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();
  for (const s of ['migrate.js', 'seed.js']) {
    const r = chay(s);
    if (r.code !== 0) throw new Error(`${s} lỗi:\n${r.out}`);
  }
}

// Dọn dữ liệu GIAO DỊCH về trạng thái sạch trước MỖI test; giữ danh mục + 3 tài khoản mẫu của seed.
async function resetDb(pool) {
  await pool.query('TRUNCATE ticket_status_log, ticket, device, customer RESTART IDENTITY CASCADE');
  await pool.query('ALTER SEQUENCE ticket_code_seq RESTART WITH 1');
  await pool.query('DELETE FROM employee WHERE employee_id > 60'); // tài khoản do test đăng ký
}

// 2 khách, 3 thiết bị (ngày mua tính TƯƠNG ĐỐI so với hôm nay để test không "hết hạn" theo thời gian)
async function seedFixtures(pool) {
  await pool.query(`INSERT INTO customer (phone, full_name, address) VALUES
    ('0901234567', 'Nguyễn Văn An', 'Cần Thơ'), ('0912345678', 'Trần Thị Bình', 'Vĩnh Long')`);
  await pool.query(`INSERT INTO device (customer_id, serial_no, product_name, purchase_date, warranty_months) VALUES
    (1, 'SN-TEST-001', 'Điện thoại Mekong A1', CURRENT_DATE - INTERVAL '2 months', 12),
    (1, 'SN-TEST-002', 'Máy tính bảng Mekong T2', CURRENT_DATE - INTERVAL '2 years', 12),
    (2, 'SN-TEST-003', 'Điện thoại Mekong A1', CURRENT_DATE - INTERVAL '1 month', 12)`);
}

// Dựng sẵn một phiếu đang mở cho thiết bị (tiền điều kiện của QT03), không đi qua service
async function insertOpenTicket(pool, { deviceId = 1, customerId = 1, centerId = 1, status = 'MOI' } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO ticket (ticket_code, customer_id, device_id, center_id, issue_desc, priority, status,
                         received_at, due_date, is_warranty)
     VALUES ('BH-900001/2026', $1, $2, $3, 'Phiếu dựng sẵn cho test', 'CAO', $4, now(), now() + interval '1 day', TRUE)
     RETURNING ticket_id`, [customerId, deviceId, centerId, status]);
  await pool.query(`INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by) VALUES ($1, NULL, $2, 1)`,
    [rows[0].ticket_id, status]);
  return rows[0].ticket_id;
}

const count = async (pool, table) => (await pool.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n;

module.exports = { prepareDb, resetDb, seedFixtures, insertOpenTicket, count, chay, TEST_URL };