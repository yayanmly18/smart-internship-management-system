const db = require('./integrations/database.client');

async function migrate() {
  try {
    const cols = await db.all("PRAGMA table_info(internships)");
    const colNames = cols.map(c => c.name);
    
    if (!colNames.includes('updated_at')) {
      await db.run("ALTER TABLE internships ADD COLUMN updated_at TEXT");
      console.log('Successfully added updated_at column to internships table.');
    } else {
      console.log('Column updated_at already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();