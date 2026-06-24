// Migration script to add internship_id column to feedbacks table
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = path.resolve(__dirname, '..', 'data.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
  console.log('Connected to database:', dbFile);
});

db.serialize(() => {
  // Check if column exists
  db.all("PRAGMA table_info(feedbacks)", (err, rows) => {
    if (err) {
      console.error('Error checking table info:', err);
      return;
    }
    
    const hasInternshipId = rows.some(col => col.name === 'internship_id');
    
    if (!hasInternshipId) {
      console.log('Adding internship_id column to feedbacks table...');
      db.run('ALTER TABLE feedbacks ADD COLUMN internship_id INTEGER', (err) => {
        if (err) {
          console.error('Error adding column:', err);
        } else {
          console.log('✓ Successfully added internship_id column to feedbacks table');
        }
        db.close();
      });
    } else {
      console.log('✓ Column internship_id already exists in feedbacks table');
      db.close();
    }
  });
});