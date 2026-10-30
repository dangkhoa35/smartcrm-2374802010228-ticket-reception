// Chạy: node scripts/make-sample.js        (cần data/raw/ đầy đủ 7 tệp CSV)
// Tạo bộ dữ liệu MẪU NHỎ vào data/sample/ để commit vào repo, giúp người chấm chạy được
// mà không cần bộ đầy đủ. Danh mục (trung tâm, nhóm sự cố, KTV, sản phẩm) giữ nguyên;
// phiếu, lịch sử và khách hàng được cắt nhỏ.
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const NGUON = process.env.DATASET_DIR || path.join('data', 'raw');
const DICH = path.join('data', 'sample');
const SO_PHIEU = Number(process.env.SO_PHIEU || 300);
const SO_KHACH = Number(process.env.SO_KHACH || 2000);

const docCsv = (f) => parse(fs.readFileSync(path.join(NGUON, f), 'utf8'), { bom: true, skip_empty_lines: true });
const o = (v) => (/[",\r\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v);
const ghiCsv = (f, rows) => {
  fs.writeFileSync(path.join(DICH, f), rows.map((r) => r.map(o).join(',')).join('\n') + '\n', 'utf8');
  console.log(`${f.padEnd(24)} ${rows.length - 1} dòng dữ liệu`);
};

fs.mkdirSync(DICH, { recursive: true });

for (const f of ['service_centers.csv', 'issue_categories.csv', 'technicians.csv', 'products.csv']) {
  ghiCsv(f, docCsv(f));
}

const phieu = docCsv('tickets_history.csv');
const phieuNho = [phieu[0], ...phieu.slice(1, 1 + SO_PHIEU)];
ghiCsv('tickets_history.csv', phieuNho);

const idPhieu = new Set(phieuNho.slice(1).map((r) => r[0]));
const log = docCsv('ticket_status_log.csv');
const iTicket = log[0].indexOf('ticket_id');
ghiCsv('ticket_status_log.csv', [log[0], ...log.slice(1).filter((r) => idPhieu.has(r[iTicket]))]);

const khach = docCsv('customers_raw.csv');
ghiCsv('customers_raw.csv', [khach[0], ...khach.slice(1, 1 + SO_KHACH)]);
