const db = require('../integrations/database.client');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';
    const existing = await db.get('SELECT id FROM users WHERE email=?', [email]);
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (name, nim, email, prodi, year, phone, password, role) VALUES (?,?,?,?,?,?,?,?)', ['Admin', '0000', email, 'Admin', '2023', '+628', hashed, 'admin']);
    console.log('Seed admin created with id', result.id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
