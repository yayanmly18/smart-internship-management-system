const db = require('../integrations/database.client');
const bcrypt = require('bcryptjs');

async function reset() {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.run(
      'UPDATE users SET password=? WHERE email=? AND role=?',
      [hashed, email, 'admin']
    );

    if (!result.changes) {
      console.log('No admin row updated. Admin not found for email/role:', email);
      process.exit(1);
    }

    console.log('Admin password reset OK for', email, 'changes:', result.changes);
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err);
    process.exit(1);
  }
}

reset();

