const db = require('./integrations/database.client');

async function migrate() {
  try {
    const cols = await db.all("PRAGMA table_info(users)");
    const colNames = cols.map(c => c.name);
    
    if (!colNames.includes('nip')) {
      await db.run("ALTER TABLE users ADD COLUMN nip TEXT");
      console.log('Successfully added nip column to users table.');
    } else {
      console.log('Column nip already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();