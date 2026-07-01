const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening sqlite DB', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    console.log('USERS:', rows ? rows.length : 0);
    if (rows && rows.length > 0) console.log('First user:', rows[0]);
  });
  db.all('SELECT * FROM companies', [], (err, rows) => {
    console.log('COMPANIES:', rows ? rows.length : 0);
  });
  db.all('SELECT * FROM internships', [], (err, rows) => {
    console.log('INTERNSHIPS:', rows ? rows.length : 0);
  });
});
