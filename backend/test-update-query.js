const db = require('./integrations/database.client');

async function test() {
  try {
    // Check if pembimbing_email column exists
    const cols = await db.all("PRAGMA table_info(internships)");
    console.log('Internships columns:', cols.map(c => c.name));

    // Try the update query
    const result = await db.run(
      'UPDATE internships SET status=?, company=?, pembimbing_email=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      ['aktif', 'PT Test', 'gs@gmail.com', 3]
    );
    console.log('Update result:', result);
  } catch (err) {
    console.error('Update failed:', err);
  }
}

test();