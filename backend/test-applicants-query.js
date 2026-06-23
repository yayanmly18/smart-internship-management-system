const db = require('./integrations/database.client');

async function test() {
  try {
    // Check actual columns in internships table
    const cols = await db.all("PRAGMA table_info(internships)");
    console.log('Internships columns:', cols.map(c => c.name));

    // Try query without pembimbing_email
    const rows = await db.all(
      `SELECT 
          u.id as userId,
          u.name,
          u.nim,
          u.email,
          u.prodi,
          u.year,
          i.status,
          i.progress,
          i.company,
          i.id as internshipId
       FROM users u
       LEFT JOIN internships i ON i.user_email = u.email
       WHERE u.role = 'mahasiswa'
       ORDER BY i.id DESC, u.id DESC`
    );
    console.log('\nQuery succeeded, rows:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Query failed:', err);
  }
}

test();