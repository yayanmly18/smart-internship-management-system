// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./integrations/database.client');

async function clearData() {
  try {
    console.log('=== Clearing Reports and Feedbacks ===\n');
    
    // Delete all feedbacks first (foreign key constraint)
    console.log('1. Deleting all feedbacks...');
    const feedbackResult = await db.run('DELETE FROM feedbacks');
    console.log('   ✓ Deleted', feedbackResult.changes, 'feedbacks');
    
    // Delete all reports
    console.log('\n2. Deleting all reports...');
    const reportResult = await db.run('DELETE FROM reports');
    console.log('   ✓ Deleted', reportResult.changes, 'reports');
    
    // Verify
    console.log('\n3. Verifying...');
    const remainingFeedbacks = await db.get('SELECT COUNT(*) as count FROM feedbacks');
    const remainingReports = await db.get('SELECT COUNT(*) as count FROM reports');
    
    console.log('   Remaining feedbacks:', remainingFeedbacks.count);
    console.log('   Remaining reports:', remainingReports.count);
    
    console.log('\n✓ All reports and feedbacks cleared successfully!');
    console.log('  Now you can test with fresh data.');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

clearData();