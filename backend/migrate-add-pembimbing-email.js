const db = require('./integrations/database.client');

async function migrate() {
  try {
    // Check if column already exists
    const cols = await db.all("PRAGMA table_info(internships)");
    const colNames = cols.map(c => c.name);
    
    if (colNames.includes('pembimbing_email')) {
      console.log('Column pembimbing_email already exists. No migration needed.');
      return;
    }

    // Add the missing column
    await db.run("ALTER TABLE internships ADD COLUMN pembimbing_email TEXT");
    console.log('Successfully added pembimbing_email column to internships table.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();