// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./integrations/database.client');

async function checkAndFix() {
  try {
    console.log('=== Checking Internship Progress ===\n');
    
    // Get all internships
    const internships = await db.all('SELECT id, user_email, progress, status FROM internships');
    
    console.log('Current internships:');
    internships.forEach(i => {
      console.log(`  ID: ${i.id}, Email: ${i.user_email}, Progress: ${i.progress}%, Status: ${i.status}`);
    });
    
    // Count reports for each internship
    console.log('\nReport counts:');
    for (const i of internships) {
      const reportCount = await db.get('SELECT COUNT(*) as count FROM reports WHERE internship_id = ?', [i.id]);
      const correctProgress = Math.round((reportCount.count / 8) * 100);
      console.log(`  Internship ${i.id}: ${reportCount.count} reports → Should be ${correctProgress}%`);
    }
    
    // Fix: Reset progress based on actual reports
    console.log('\n=== Fixing Progress ===');
    for (const i of internships) {
      const reportCount = await db.get('SELECT COUNT(*) as count FROM reports WHERE internship_id = ?', [i.id]);
      const correctProgress = Math.min(100, Math.round((reportCount.count / 8) * 100));
      const correctStatus = correctProgress >= 100 ? 'selesai' : (correctProgress > 0 ? 'aktif' : 'pending');
      
      await db.run(
        'UPDATE internships SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [correctProgress, correctStatus, i.id]
      );
      console.log(`  ✓ Fixed internship ${i.id}: ${correctProgress}% (${reportCount.count} reports)`);
    }
    
    // Verify
    console.log('\n=== Verification ===');
    const updated = await db.all('SELECT id, user_email, progress, status FROM internships');
    updated.forEach(i => {
      console.log(`  ID: ${i.id}, Email: ${i.user_email}, Progress: ${i.progress}%, Status: ${i.status}`);
    });
    
    console.log('\n✓ Progress fixed based on actual report count!');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkAndFix();