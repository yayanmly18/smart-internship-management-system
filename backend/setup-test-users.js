const bcrypt = require('bcryptjs');
const db = require('./integrations/database.client');

async function setupUsers() {
  try {
    console.log('=== Setting up test users ===\n');
    
    // Hash password
    const password = 'password123';
    const hashed = await bcrypt.hash(password, 10);
    
    // Update Yayan Mulyana (mahasiswa)
    console.log('1. Setting password for Yayan Mulyana...');
    const yayan = await db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashed, 'yayanmaulyana845@gmail.com']
    );
    console.log('   Rows affected:', yayan.changes);
    
    // Update YANTO (pembimbing)
    console.log('2. Setting password for YANTO...');
    const yanto = await db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashed, 'yanto@gmail.com']
    );
    console.log('   Rows affected:', yanto.changes);
    
    // Update GOAT (mahasiswa)
    console.log('3. Setting password for GOAT...');
    const goat = await db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashed, 'goat@gmail.com']
    );
    console.log('   Rows affected:', goat.changes);
    
    console.log('\n✓ All passwords set to: password123');
    console.log('\nYou can now login with:');
    console.log('  - Yayan Mulyana: yayanmaulyana845@gmail.com / password123');
    console.log('  - YANTO: yanto@gmail.com / password123');
    console.log('  - GOAT: goat@gmail.com / password123');
    console.log('  - Admin: admin@example.com / adminpass');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setupUsers();