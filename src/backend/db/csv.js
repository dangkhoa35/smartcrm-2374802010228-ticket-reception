// Đọc CSV của bộ dữ liệu mẫu. Thư mục mặc định: data/raw/ (đã nằm trong .gitignore).
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DIR = process.env.DATASET_DIR || path.join(process.cwd(), 'data', 'raw');

function readCsv(name) {
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) {
    throw new Error(`Không thấy ${file}. Đặt các file CSV của học phần vào data/raw/ (hoặc đặt DATASET_DIR).`);
  }
  return parse(fs.readFileSync(file, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
}

module.exports = { readCsv, DIR };
