const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../integrations/database.client');

async function deleteMahasiswaUsers() {
  try {
    console.log('Connecting to database...');
    
    // Get all mahasiswa users
    const mahasiswaUsers = await db.all('SELECT id, name, email, nim FROM users WHERE role = ?', ['mahasiswa']);
    
    if (mahasiswaUsers.length === 0) {
      console.log('No mahasiswa users found in database.');
      process.exit(0);
    }
    
    console.log(`Found ${mahasiswaUsers.length} mahasiswa users:`);
    mahasiswaUsers.forEach(u => {
      console.log(`  - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, NIM: ${u.nim}`);
    });
    
    // Confirm deletion
    console.log('\nDeleting mahasiswa users and related data...');
    
    for (const user of mahasiswaUsers) {
      // Delete related internships
      const internshipResult = await db.run('DELETE FROM internships WHERE user_email = ?', [user.email]);
      console.log(`  Deleted ${internshipResult.changes} internship(s) for ${user.name}`);
      
      // Delete related feedbacks
      const feedbackResult = await db.run('DELETE FROM feedbacks WHERE student_id = ?', [user.nim]);
      console.log(`  Deleted ${feedbackResult.changes} feedback(s) for ${user.name}`);
      
      // Delete related reports
      const reportResult = await db.run('DELETE FROM reports WHERE internship_id IN (SELECT id FROM internships WHERE user_email = ?)', [user.email]);
      console.log(`  Deleted ${reportResult.changes} report(s) for ${user.name}`);
      
      // Delete the user
      const userResult = await db.run('DELETE FROM users WHERE id = ?', [user.id]);
      console.log(`  Deleted user: ${user.name} (ID: ${user.id})`);
    }
    
    console.log('\n✓ Successfully deleted all mahasiswa users and related data');
    
    // Verify
    const remainingUsers = await db.all('SELECT id, name, role FROM users ORDER BY id');
    console.log('\nRemaining users:');
    remainingUsers.forEach(u => {
      console.log(`  - ID: ${u.id}, Name: ${u.name}, Role: ${u.role}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

deleteMahasiswaUsers();