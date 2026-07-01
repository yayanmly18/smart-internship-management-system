const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sqliteDbPath = path.join(__dirname, '..', 'data.sqlite');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateData() {
  const sqliteDb = new sqlite3.Database(sqliteDbPath, (err) => {
    if (err) {
      console.error('Error opening sqlite DB', err);
      process.exit(1);
    }
  });

  const getSqliteData = (query) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    console.log('--- Starting Data Migration from SQLite to PostgreSQL ---');

    // 1. Users
    const users = await getSqliteData('SELECT * FROM users');
    if (users.length > 0) {
      console.log(`Migrating ${users.length} users...`);
      for (const u of users) {
        await pgPool.query(
          `INSERT INTO users (id, name, nim, nip, email, prodi, year, phone, password, role) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
          [u.id, u.name, u.nim, u.nip, u.email, u.prodi, u.year, u.phone, u.password, u.role]
        );
      }
      // Set sequence
      await pgPool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
    }

    // 2. Companies
    const companies = await getSqliteData('SELECT * FROM companies');
    if (companies.length > 0) {
      console.log(`Migrating ${companies.length} companies...`);
      for (const c of companies) {
        await pgPool.query(
          `INSERT INTO companies (id, name, city, bidang, quota) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (name) DO NOTHING`,
          [c.id, c.name, c.city, c.bidang, c.quota]
        );
      }
      await pgPool.query(`SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies))`);
    }

    // 3. Internships
    const internships = await getSqliteData('SELECT * FROM internships');
    if (internships.length > 0) {
      console.log(`Migrating ${internships.length} internships...`);
      for (const i of internships) {
        await pgPool.query(
          `INSERT INTO internships (id, user_email, name, nim, prodi, year, phone, motivation, skills, status, progress, company, company_bidang, pembimbing_email) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [i.id, i.user_email, i.name, i.nim, i.prodi, i.year, i.phone, i.motivation, i.skills, i.status, i.progress, i.company, i.company_bidang, i.pembimbing_email]
        );
      }
      await pgPool.query(`SELECT setval('internships_id_seq', (SELECT MAX(id) FROM internships))`);
    }

    console.log('--- Migration Complete! ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqliteDb.close();
    pgPool.end();
  }
}

migrateData();
