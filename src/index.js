require('dotenv').config(); // Chạy từ thư mục gốc nên không cần path: '../../.env'
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

// Khởi tạo Pool kết nối cho MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'smartcrm',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
});

// Endpoint 1: Trả về dòng chữ theo đúng yêu cầu
app.get('/', (req, res) => res.send('Hello Smart CRM'));

// Endpoint 2: Kiểm tra kết nối CSDL
app.get('/db-check', async (req, res) => {
  try {
    // MySQL sử dụng NOW() tương tự PostgreSQL
    const [rows] = await pool.query('SELECT NOW() AS server_time');
    res.json({ status: 'OK', ...rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server chạy tại http://localhost:' + port));