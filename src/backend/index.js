require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartcrm',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
});

app.get('/', (req, res) => res.send('Hello Smart CRM'));

app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS server_time');
    res.json({ status: 'OK', ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

const port = process.env.APP_PORT || process.env.PORT || 3000;
app.listen(port, () => console.log('Server chạy tại http://localhost:' + port));