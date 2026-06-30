const db = require('./integrations/database.client');

async function main() {
  const sql = "SELECT id,name,email,nip,role FROM users WHERE role='pembimbing' ORDER BY id DESC LIMIT 50";
  try {
    // For pg mode db might be pool; for sqlite mode db exports wrapped helper functions.
    if (typeof db.all === 'function') {
      const rows = await db.all(sql);
      console.log('Pembimbing users (role=pembimbing):');
      console.table(rows);
    } else if (typeof db.query === 'function') {
      const { rows } = await db.query(sql);
      console.table(rows);
    } else {
      console.log('Unknown db interface:', Object.keys(db));
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed query:', e);
    process.exit(1);
  }
}

main().then(()=>process.exit(0));

