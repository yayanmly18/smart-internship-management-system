const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../integrations/database.client');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';
    
    console.log('Checking if admin exists in PostgreSQL...');
    const existing = await db.get('SELECT id FROM users WHERE email=?', [email]);
    
    if (existing) {
      console.log('Admin already exists in PostgreSQL with id:', existing.id);
      process.exit(0);
    }
    
    console.log('Creating admin user in PostgreSQL...');
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, nim, email, prodi, year, phone, password, role) VALUES (?,?,?,?,?,?,?,?)',
      ['Admin', '0000', email, 'Admin', '2023', '+628', hashed, 'admin']
    );
    
    console.log('✓ Admin user created successfully in PostgreSQL');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Role: admin');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seed();