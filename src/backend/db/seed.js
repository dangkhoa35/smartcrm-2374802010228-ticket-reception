// Chạy: npm run seed
// Nạp DỮ LIỆU DANH MỤC từ bộ dữ liệu mẫu: service_centers.csv, issue_categories.csv,
// technicians.csv, và sinh 60 mã nhân viên (xem chú thích bảng employee ở migration 002).
// Chạy lại được: dữ liệu đã có thì bỏ qua.
// Cuối cùng gắn 3 TÀI KHOẢN MẪU (mỗi vai trò một tài khoản) vào mã nhân viên 1, 2, 3 (xem DEMO_ACCOUNTS).
// CHỈ để chạy thử/chấm bài: đổi hoặc xoá các tài khoản này trước khi triển khai thật.
const { pool } = require('./pool');
const { readCsv } = require('./csv');
const { hashPassword } = require('../utils/password');

const DEMO_ACCOUNTS = [
  { employeeId: 1, role: 'NHAN_VIEN_TIEP_NHAN', username: 'tiepnhan',   password: 'Tiepnhan@123', fullName: 'Tiếp nhận Mẫu' },
  { employeeId: 2, role: 'KY_THUAT_VIEN',       username: 'kythuatvien', password: 'Kythuat@123',  fullName: 'Kỹ thuật Mẫu' },
  { employeeId: 3, role: 'QUAN_LY_TRUNG_TAM',   username: 'quanly',      password: 'Quanly@123',   fullName: 'Quản lý Mẫu' },
];

const col = (rows, key, conv = (v) => v) => rows.map((r) => conv(r[key]));
const bool = (v) => String(v).toLowerCase() === 'true';

async function run() {
  const centers = readCsv('service_centers.csv');
  const cats = readCsv('issue_categories.csv');
  const techs = readCsv('technicians.csv');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO service_center (center_id, center_code, center_name, city)
       SELECT * FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[])
       ON CONFLICT DO NOTHING`,
      [col(centers, 'center_id', Number), col(centers, 'center_code'),
       col(centers, 'center_name'), col(centers, 'thanh_pho')]);

    await client.query(
      `INSERT INTO issue_category (category_id, category_name, default_priority, is_active)
       SELECT * FROM unnest($1::int[], $2::text[], $3::text[], $4::boolean[])
       ON CONFLICT DO NOTHING`,
      [col(cats, 'category_id', Number), col(cats, 'category_name'),
       col(cats, 'default_priority'), col(cats, 'is_active', bool)]);

    await client.query(
      `INSERT INTO technician (technician_id, technician_code, full_name, center_id, level, is_active)
       SELECT * FROM unnest($1::bigint[], $2::text[], $3::text[], $4::bigint[], $5::text[], $6::boolean[])
       ON CONFLICT DO NOTHING`,
      [col(techs, 'technician_id', Number), col(techs, 'technician_code'), col(techs, 'ho_ten'),
       col(techs, 'center_id', Number), col(techs, 'level'), col(techs, 'is_active', bool)]);

    // 60 mã người thực hiện: id 1,4,7.. tiếp nhận; 2,5,8.. kỹ thuật viên; 3,6,9.. quản lý.
    // Mỗi 10 mã thuộc một trung tâm (1-10 -> TT01, ..., 51-60 -> TT06).
    await client.query(
      `INSERT INTO employee (employee_id, full_name, role, center_id)
       SELECT g, 'Nhân viên ' || lpad(g::text, 2, '0'),
              CASE g % 3 WHEN 1 THEN 'NHAN_VIEN_TIEP_NHAN'
                         WHEN 2 THEN 'KY_THUAT_VIEN'
                         ELSE 'QUAN_LY_TRUNG_TAM' END,
              ((g - 1) / 10) + 1
       FROM generate_series(1, 60) AS g
       ON CONFLICT DO NOTHING`);

    // Tài khoản mẫu: chỉ gán khi mã nhân viên CHƯA có tài khoản và đúng vai trò -> chạy lại không đổi gì
    for (const a of DEMO_ACCOUNTS) {
      await client.query(
        `UPDATE employee SET username = $1, password_hash = $2, full_name = $3
         WHERE employee_id = $4 AND role = $5 AND username IS NULL
           AND NOT EXISTS (SELECT 1 FROM employee WHERE username = $1)`,
        [a.username, await hashPassword(a.password), a.fullName, a.employeeId, a.role]);
    }

    // Đồng bộ sequence vì đã chèn id tường minh
    for (const [tbl, c] of [['service_center', 'center_id'], ['issue_category', 'category_id'],
                            ['technician', 'technician_id'], ['employee', 'employee_id']]) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${tbl}', '${c}'), (SELECT max(${c}) FROM ${tbl}))`);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(`
    SELECT 'service_center' AS bang, count(*)::int AS so_dong FROM service_center UNION ALL
    SELECT 'issue_category', count(*)::int FROM issue_category UNION ALL
    SELECT 'technician',     count(*)::int FROM technician UNION ALL
    SELECT 'employee',       count(*)::int FROM employee UNION ALL
    SELECT 'employee có tài khoản', count(*)::int FROM employee WHERE username IS NOT NULL`);
  console.table(rows);
  await pool.end();
}

run().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
