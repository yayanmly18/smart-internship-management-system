const bcrypt = require('bcryptjs');
const db = require('./integrations/database.client');

async function resetPassword() {
  try {
    const email = 'yanto@gmail.com';
    const newPassword = 'password123';
    
    console.log('Resetting password for:', email);
    
    // Hash the new password
    const hashed = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const result = await db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashed, email]
    );
    
    console.log('✓ Password reset successful');
    console.log('  Email:', email);
    console.log('  New password:', newPassword);
    console.log('  Rows affected:', result.changes);
    
    // Verify the user exists
    const user = await db.get('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    console.log('\nUser info:', user);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

resetPassword();