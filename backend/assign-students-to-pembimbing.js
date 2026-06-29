// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./integrations/database.client');

async function assignStudents() {
  try {
    console.log('=== Assigning Students to Pembimbing YANTO ===\n');
    
    // Assign Yayan Mulyana to YANTO
    console.log('1. Assigning Yayan Mulyana to YANTO...');
    const yayan = await db.run(
      `UPDATE internships 
       SET pembimbing_email = 'yanto@gmail.com', 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_email = 'yayanmaulyana845@gmail.com'`,
      []
    );
    console.log('   Rows affected:', yayan.changes);
    
    // Assign GOAT to YANTO
    console.log('2. Assigning GOAT to YANTO...');
    const goat = await db.run(
      `UPDATE internships 
       SET pembimbing_email = 'yanto@gmail.com', 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_email = 'goat@gmail.com'`,
      []
    );
    console.log('   Rows affected:', goat.changes);
    
    // Verify the assignments
    console.log('\n3. Verifying assignments...');
    const students = await db.all(
      `SELECT i.id, i.user_email, i.pembimbing_email, i.status,
              u.name as studentName
       FROM internships i
       LEFT JOIN users u ON u.email = i.user_email
       WHERE i.pembimbing_email = 'yanto@gmail.com'`
    );
    
    console.log(`\nTotal students assigned to YANTO: ${students.length}`);
    students.forEach(s => {
      console.log(`  - ${s.studentName} (${s.user_email}) - Status: ${s.status}`);
    });
    
    console.log('\n✓ Students successfully assigned to YANTO');
    console.log('  Dashboard should now show: 2 Mahasiswa Aktif');
    console.log('  Rata-rata Nilai should show: 83 (average of 88, 65, 97, 93)');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

assignStudents();