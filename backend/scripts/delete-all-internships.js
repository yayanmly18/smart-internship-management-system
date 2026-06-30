const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../integrations/database.client');

async function deleteAllInternships() {
  try {
    console.log('Connecting to database...');
    
    // Count current internships
    const internshipCount = await db.get('SELECT COUNT(*) as c FROM internships');
    console.log(`Found ${internshipCount.c} internship(s) in database`);
    
    if (internshipCount.c === 0) {
      console.log('No internships to delete.');
      process.exit(0);
    }
    
    // Delete all feedbacks first (foreign key dependency)
    const feedbackResult = await db.run('DELETE FROM feedbacks');
    console.log(`Deleted ${feedbackResult.changes} feedback(s)`);
    
    // Delete all reports
    const reportResult = await db.run('DELETE FROM reports');
    console.log(`Deleted ${reportResult.changes} report(s)`);
    
    // Delete all internships
    const internshipResult = await db.run('DELETE FROM internships');
    console.log(`Deleted ${internshipResult.changes} internship(s)`);
    
    console.log('\n✓ Successfully deleted all internship data');
    
    // Verify
    const remainingInternships = await db.get('SELECT COUNT(*) as c FROM internships');
    console.log(`\nRemaining internships: ${remainingInternships.c}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

deleteAllInternships();