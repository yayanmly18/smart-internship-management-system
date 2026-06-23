const db = require('./integrations/database.client');

async function test() {
  try {
    // Check actual columns
    const cols = await db.all("PRAGMA table_info(users)");
    console.log('Users columns:', cols.map(c => c.name));

    // Try query without nip
    const rows = await db.all('SELECT id, name, email FROM users WHERE role=?', ['pembimbing']);
    console.log('Pembimbing query succeeded, rows:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Query failed:', err);
  }
}

test();