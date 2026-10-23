// Chạy: npm run import:history   (sau migrate + seed)
// Nạp DỮ LIỆU THỬ NGHIỆM từ tickets_history.csv + ticket_status_log.csv (7.800 phiếu, ~38.000 dòng lịch sử).
//
// Bộ dữ liệu không có sẵn bảng customer/device khớp với phiếu nên script TỰ DỰNG:
//  - customer: tickets_history.customer_id (6.443 giá trị) KHÔNG nối được với customers_raw.csv
//    (file này đã bị xáo và đánh lại số thứ tự). Script làm sạch customers_raw (chuẩn hóa SĐT,
//    khử trùng theo SĐT, sửa tên) rồi gán ngẫu nhiên có seed cố định cho các customer_id đó.
//    => hồ sơ khách chỉ để có dữ liệu kiểm thử, KHÔNG phản ánh khách thật của phiếu.
//  - device: mỗi phiếu có serial_no riêng nên mỗi phiếu = một thiết bị (device_id = ticket_id).
//    Không có ngày mua nên purchase_date được SUY RA từ cờ is_warranty của phiếu.
// Chạy lại được: bỏ qua dòng đã có. Dùng `--reset` để xóa sạch dữ liệu phiếu/khách/thiết bị rồi nạp lại.
const { pool } = require('./pool');
const { readCsv } = require('./csv');
const { normalizePhone } = require('../utils/phone');

const SEED = 20260901; // seed của bộ dữ liệu; ghi vào README

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const col = (rows, f) => rows.map(f);
const nul = (v) => (v === '' || v === undefined ? null : v);
const tz = (s) => (s ? `${s}+07` : null); // CSV không có múi giờ -> coi là giờ Việt Nam

function titleCase(s) {
  return s.split(' ').map((w) => (w ? w[0].toLocaleUpperCase('vi') + w.slice(1).toLocaleLowerCase('vi') : w)).join(' ');
}

// Làm sạch customers_raw: một hồ sơ cho mỗi SĐT hợp lệ.
function cleanCustomers() {
  const groups = new Map();
  for (const r of readCsv('customers_raw.csv')) {
    const phone = normalizePhone(r.so_dien_thoai);
    if (!phone) continue; // thiếu hoặc sai định dạng SĐT -> bỏ (phone NOT NULL UNIQUE)
    if (!groups.has(phone)) groups.set(phone, []);
    groups.get(phone).push(r);
  }
  const score = (r) => {
    const n = r.ho_ten.trim();
    const mixed = n !== n.toUpperCase() && n !== n.toLowerCase();
    return (/[^\x00-\x7f]/.test(n) ? 2 : 0) + (mixed ? 2 : 0) + (r.email ? 1 : 0) + (r.dia_chi ? 1 : 0);
  };
  const out = [];
  for (const [phone, recs] of groups) {
    const best = recs.reduce((a, b) => (score(b) > score(a) ? b : a));
    let name = best.ho_ten.replace(/\s+/g, ' ').trim();
    if (name === name.toUpperCase() || name === name.toLowerCase()) name = titleCase(name);
    out.push({
      phone, name,
      email: nul(recs.map((r) => r.email).find(Boolean)),
      address: nul(recs.map((r) => r.dia_chi).find(Boolean)),
      created: best.ngay_tao,
    });
  }
  out.sort((a, b) => (a.phone < b.phone ? -1 : 1)); // thứ tự ổn định để tái lập
  return out;
}

function addMonths(isoDate, m) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString().slice(0, 10);
}

async function run() {
  const reset = process.argv.includes('--reset');
  const tickets = readCsv('tickets_history.csv');
  const logs = readCsv('ticket_status_log.csv');
  const products = new Map(readCsv('products.csv').map((p) => [Number(p.product_id), p]));

  const emp = (await pool.query('SELECT count(*)::int AS n FROM employee')).rows[0].n;
  if (emp === 0) throw new Error('Chưa có danh mục. Chạy `npm run seed` trước.');

  // --- customer: gán hồ sơ đã làm sạch cho từng customer_id xuất hiện trong phiếu
  const ids = [...new Set(tickets.map((t) => Number(t.customer_id)))].sort((a, b) => a - b);
  const pool_ = cleanCustomers();
  if (pool_.length < ids.length) throw new Error('Không đủ hồ sơ khách sạch để gán');
  const rnd = mulberry32(SEED);
  for (let i = pool_.length - 1; i > 0; i--) { // xáo trộn Fisher-Yates có seed
    const j = Math.floor(rnd() * (i + 1));
    [pool_[i], pool_[j]] = [pool_[j], pool_[i]];
  }
  const custs = ids.map((id, i) => ({ id, ...pool_[i] }));

  // --- device: một thiết bị cho mỗi phiếu
  const devices = tickets.map((t) => {
    const p = products.get(Number(t.product_id));
    if (!p) throw new Error('Không thấy product_id ' + t.product_id);
    const wm = Number(p.warranty_months);
    const received = t.received_at.slice(0, 10);
    // còn bảo hành: mua cách đây nửa thời hạn; hết bảo hành: mua trước đó (thời hạn + 3 tháng)
    const purchase = t.is_warranty === 'true' ? addMonths(received, -Math.floor(wm / 2)) : addMonths(received, -(wm + 3));
    return { id: Number(t.ticket_id), customer: Number(t.customer_id), serial: t.serial_no,
             name: p.product_name, purchase, wm };
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (reset) {
      await client.query('TRUNCATE ticket_status_log, ticket, device, customer RESTART IDENTITY');
      await client.query('ALTER SEQUENCE ticket_code_seq RESTART WITH 1');
      console.log('đã xóa dữ liệu phiếu/khách/thiết bị cũ');
    }

    await client.query(
      `INSERT INTO customer (customer_id, phone, full_name, email, address, created_at)
       SELECT * FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[], $6::timestamptz[])
       ON CONFLICT DO NOTHING`,
      [col(custs, (c) => c.id), col(custs, (c) => c.phone), col(custs, (c) => c.name),
       col(custs, (c) => c.email), col(custs, (c) => c.address), col(custs, (c) => tz(c.created + ' 00:00'))]);

    await client.query(
      `INSERT INTO device (device_id, customer_id, serial_no, product_name, purchase_date, warranty_months)
       SELECT * FROM unnest($1::bigint[], $2::bigint[], $3::text[], $4::text[], $5::date[], $6::smallint[])
       ON CONFLICT DO NOTHING`,
      [col(devices, (d) => d.id), col(devices, (d) => d.customer), col(devices, (d) => d.serial),
       col(devices, (d) => d.name), col(devices, (d) => d.purchase), col(devices, (d) => d.wm)]);

    await client.query(
      `INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, center_id,
                           issue_desc, priority, status, technician_id, received_at, due_date,
                           closed_at, is_warranty)
       SELECT * FROM unnest($1::bigint[], $2::text[], $3::bigint[], $4::bigint[], $5::int[], $6::bigint[],
                            $7::text[], $8::text[], $9::text[], $10::bigint[], $11::timestamptz[],
                            $12::timestamptz[], $13::timestamptz[], $14::boolean[])
       ON CONFLICT DO NOTHING`,
      [col(tickets, (t) => Number(t.ticket_id)), col(tickets, (t) => t.ticket_code),
       col(tickets, (t) => Number(t.customer_id)), col(tickets, (t) => Number(t.ticket_id)),
       col(tickets, (t) => Number(t.category_id)), col(tickets, (t) => Number(t.center_id)),
       col(tickets, (t) => t.issue_desc), col(tickets, (t) => t.priority), col(tickets, (t) => t.status),
       col(tickets, (t) => Number(t.technician_id)), col(tickets, (t) => tz(t.received_at)),
       col(tickets, (t) => tz(t.due_date)), col(tickets, (t) => tz(nul(t.closed_at))),
       col(tickets, (t) => t.is_warranty === 'true')]);

    await client.query(
      `INSERT INTO ticket_status_log (log_id, ticket_id, from_status, to_status, changed_at, changed_by, note)
       SELECT * FROM unnest($1::bigint[], $2::bigint[], $3::text[], $4::text[], $5::timestamptz[],
                            $6::bigint[], $7::text[])
       ON CONFLICT DO NOTHING`,
      [col(logs, (l) => Number(l.log_id)), col(logs, (l) => Number(l.ticket_id)),
       col(logs, (l) => nul(l.from_status)), col(logs, (l) => l.to_status),
       col(logs, (l) => tz(l.changed_at)), col(logs, (l) => Number(l.changed_by)),
       col(logs, (l) => nul(l.note))]);

    for (const [tbl, c] of [['customer', 'customer_id'], ['device', 'device_id'],
                            ['ticket', 'ticket_id'], ['ticket_status_log', 'log_id']]) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${tbl}', '${c}'), (SELECT max(${c}) FROM ${tbl}))`);
    }
    // Phiếu mới do API tạo có số thứ tự tiếp sau 7800 (mã phiếu cũ có số = ticket_id)
    await client.query(`SELECT setval('ticket_code_seq', (SELECT max(ticket_id) FROM ticket))`);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(`
    SELECT 'customer' AS bang, count(*)::int AS so_dong FROM customer UNION ALL
    SELECT 'device', count(*)::int FROM device UNION ALL
    SELECT 'ticket', count(*)::int FROM ticket UNION ALL
    SELECT 'ticket_status_log', count(*)::int FROM ticket_status_log`);
  console.table(rows);

  // Gợi ý id để thử POST /api/tickets (thiết bị của phiếu đã đóng, trung tâm 1)
  const pick = async (cond) => (await pool.query(
    `SELECT d.device_id, d.customer_id FROM device d JOIN ticket t ON t.device_id = d.device_id
      WHERE t.status = 'DA_DONG' AND t.center_id = 1 AND ${cond} ORDER BY d.device_id LIMIT 1`)).rows[0];
  const ok = await pick(`d.purchase_date + make_interval(months => d.warranty_months) >= current_date`);
  const expired = await pick(`d.purchase_date + make_interval(months => d.warranty_months) < current_date`);
  console.log('Thử POST (còn bảo hành, tạo được):', ok);
  console.log('Thử POST (hết bảo hành, cần approved_by):', expired);
  await pool.end();
}

run().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
