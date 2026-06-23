const bcrypt = require('bcryptjs');
const db = require('./integrations/database.client');

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';

  // show all matching emails regardless of role
  const rows = await db.all(
    'SELECT id, email, role, name, nim, prodi, year, phone, password FROM users WHERE email = ?',
    [email]
  );


  console.log('[DEBUG] users by email:', email);
  if (!rows || rows.length === 0) {
    console.log('  - NOT FOUND');
    process.exit(1);
  }

  for (const row of rows) {
    const match = await bcrypt.compare(password, row.password);
    console.log(`  - id=${row.id} role=${row.role} name=${row.name}`);
    console.log(`    passwordMatch=${match}`);
  }

  console.log('[DEBUG] Done');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

