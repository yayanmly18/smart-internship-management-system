// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./integrations/database.client');

async function testAPIResponse() {
  try {
    console.log('=== Testing API Response ===\n');
    
    // Simulate the pembimbing controller logic
    const pembimbing = await db.get('SELECT email FROM users WHERE id = ? AND role = ?', [3, 'pembimbing']);
    console.log('Pembimbing email:', pembimbing.email);
    
    const rows = await db.all(
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
    
    console.log('\nRaw rows from DB:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Process like the controller does
    const byStudent = new Map();
    for (const r of rows || []) {
      const key = r.user_email || r.internshipId;
      if (!byStudent.has(key)) {
        byStudent.set(key, r);
      }
    }
    
    console.log('\nAfter deduplication:');
    const uniqueStudents = Array.from(byStudent.values());
    console.log(JSON.stringify(uniqueStudents, null, 2));
    
    // Now enrich with reports and feedbacks
    const enriched = await Promise.all(
      uniqueStudents.map(async (r) => {
        const reportCountResult = await db.get(
          'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
          [r.internshipId]
        );
        const reportCount = reportCountResult?.count || 0;
        
        const feedbacks = await db.all(
          `SELECT score FROM feedbacks WHERE student_id = ? AND internship_id = ?`,
          [r.studentNim || r.user_email, r.internshipId]
        );
        
        const scores = feedbacks.filter(f => f.score).map(f => f.score);
        const avgScore = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : null;
        
        return {
          internshipId: r.internshipId,
          userEmail: r.user_email,
          studentName: r.studentName,
          studentNim: r.studentNim ?? null,
          company: r.company || '-',
          status: r.status || 'pending',
          progress: r.progress ?? 0,
          reportCount,
          avgScore,
        };
      })
    );
    
    console.log('\nFinal enriched data:');
    const finalResponse = { success: true, data: { students: enriched } };
    console.log(JSON.stringify(finalResponse, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAPIResponse();