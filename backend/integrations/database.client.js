const { Pool } = require('pg');
require('dotenv').config(); // Tambahan wajib biar bisa baca file .env

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'smart_intern_db', 
  password: process.env.DB_PASS || 'postgres', 
  port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Gagal koneksi ke database PostgreSQL:', err.message);
  }
  console.log('✅ Koneksi ke PostgreSQL Berhasil & Siap Tempur!');
  release();
});

module.exports = pool;