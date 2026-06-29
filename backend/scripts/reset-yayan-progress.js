const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../integrations/database.client');

async function resetYayanProgress() {
  try {
    console.log('Connecting to database...');
    
    // Find Yayan Mulyana's internship
    const internship = await db.get(
      'SELECT id, user_email, progress FROM internships WHERE user_email = ?',
      ['yayanmaulyana845@gmail.com']
    );
    
    if (!internship) {
      console.log('No internship found for Yayan Mulyana');
      process.exit(0);
    }
    
    console.log(`Found internship ID: ${internship.id}`);
    console.log(`Current progress: ${internship.progress}%`);
    
    // Delete all reports for this internship
    const reportResult = await db.run('DELETE FROM reports WHERE internship_id = ?', [internship.id]);
    console.log(`Deleted ${reportResult.changes} report(s)`);
    
    // Delete all feedbacks for this student
    const feedbackResult = await db.run(
      'DELETE FROM feedbacks WHERE student_id = ? OR internship_id = ?',
      ['yayanmaulyana845@gmail.com', internship.id]
    );
    console.log(`Deleted ${feedbackResult.changes} feedback(s)`);
    
    // Reset progress to 0%
    await db.run(
      'UPDATE internships SET progress = 0, status = ? WHERE id = ?',
      ['aktif', internship.id]
    );
    console.log('Reset progress to 0%');
    
    console.log('\n✓ Successfully reset Yayan Mulyana\'s progress');
    
    // Verify
    const updated = await db.get('SELECT progress, status FROM internships WHERE id = ?', [internship.id]);
    console.log(`New progress: ${updated.progress}%`);
    console.log(`Status: ${updated.status}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetYayanProgress();