const db = require('./integrations/database.client');

async function main() {
  console.log('=== tmp-debug-pembimbing-postgres START ===');
  console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);

  const sql = `
    SELECT id,
           name,
           email,
           role,
           LENGTH(password) as pw_len
    FROM users
    WHERE role='pembimbing'
    ORDER BY id DESC
    LIMIT 20
  `;

  try {
    console.log('Running query...');
    const rows = await db.all(sql, []);
    console.log('Query done. rows.length =', rows?.length);
    console.table(rows);
    console.log('=== tmp-debug-pembimbing-postgres END SUCCESS ===');
    process.exit(0);
  } catch (e) {
    console.error('Query failed:', e?.message || e);
    console.error(e);
    console.log('=== tmp-debug-pembimbing-postgres END FAIL ===');
    process.exit(1);
  }
}

main();


