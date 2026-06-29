// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./integrations/database.client');

async function debugStudentData() {
  try {
    console.log('=== Debugging Student Data ===\n');
    
    // Get pembimbing YANTO
    const pembimbing = await db.get('SELECT id, email, name FROM users WHERE role = ?', ['pembimbing']);
    console.log('Pembimbing:', pembimbing);
    
    // Get internships for this pembimbing
    const internships = await db.all(
      'SELECT id, user_email, pembimbing_email FROM internships WHERE pembimbing_email = ?',
      [pembimbing.email]
    );
    console.log('\nInternships:', internships);
    
    // Try to get users for each internship
    for (const i of internships) {
      console.log(`\n--- Internship ${i.id} ---`);
      console.log('User email:', i.user_email);
      
      // Try exact match
      const userExact = await db.get('SELECT id, name, nim, email FROM users WHERE email = ?', [i.user_email]);
      console.log('Exact match:', userExact);
      
      // Try case insensitive
      const userInsensitive = await db.get('SELECT id, name, nim, email FROM users WHERE LOWER(email) = LOWER(?)', [i.user_email]);
      console.log('Case insensitive:', userInsensitive);
    }
    
    // Try the full query
    console.log('\n=== Full Query Test ===');
    const fullQuery = await db.all(
      `SELECT
        i.id AS "internshipId",
        i.user_email,
        us.name AS "studentName",
        us.nim AS "studentNim",
        i.company,
        i.status,
        i.progress
      FROM internships i
      LEFT JOIN users us ON LOWER(us.email) = LOWER(i.user_email)
      WHERE LOWER(i.pembimbing_email) = LOWER(?)
      ORDER BY i.created_at DESC`,
      [pembimbing.email]
    );
    
    console.log('Full query results:');
    fullQuery.forEach(r => {
      console.log(`  ID: ${r.internshipId}, Email: ${r.user_email}, Name: ${r.studentName}, NIM: ${r.studentNim}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

debugStudentData();