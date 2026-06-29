const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres123@127.0.0.1:5432/postgres'
});

pool.query('SELECT 1')
  .then(() => {
    console.log('✓ PostgreSQL connected successfully');
    return pool.end();
  })
  .then(() => {
    console.log('Connection closed');
    process.exit(0);
  })
  .catch(e => {
    console.error('✗ Error:', e.message);
    process.exit(1);
  });