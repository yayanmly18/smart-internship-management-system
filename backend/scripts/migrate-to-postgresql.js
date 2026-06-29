const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting PostgreSQL migration...');
    console.log('Database:', process.env.DATABASE_URL);
    console.log('');
    
    // Baca schema dari file SQL
    const schemaPath = path.join(__dirname, '..', 'schema-postgresql.sql');
    
    // Jika file tidak ada, buat schema inline
    let schema;
    if (fs.existsSync(schemaPath)) {
      schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('Using schema file:', schemaPath);
    } else {
      console.log('Schema file not found, using inline schema...');
      schema = getInlineSchema();
    }
    
    // Jalankan schema
    console.log('Creating tables...');
    await client.query(schema);
    
    console.log('✓ Migration completed successfully');
    console.log('');
    
    // Verifikasi tabel
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

function getInlineSchema() {
  return `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  nim TEXT UNIQUE,
  nip TEXT UNIQUE,
  email TEXT UNIQUE,
  prodi TEXT,
  year TEXT,
  phone TEXT,
  password TEXT,
  role TEXT,
  gpa REAL DEFAULT 0,
  semester INTEGER DEFAULT 1,
  organization_exp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Internships table
CREATE TABLE IF NOT EXISTS internships (
  id SERIAL PRIMARY KEY,
  user_email TEXT,
  name TEXT,
  nim TEXT,
  prodi TEXT,
  year TEXT,
  phone TEXT,
  motivation TEXT,
  skills TEXT,
  certificates TEXT,
  documents TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  company TEXT,
  company_bidang TEXT,
  pembimbing_email TEXT,
  eligibility_score INTEGER DEFAULT 0,
  eligibility_passed INTEGER DEFAULT 0,
  match_score INTEGER DEFAULT 0,
  final_score REAL DEFAULT 0,
  grade TEXT DEFAULT '-',
  certificate_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  week INTEGER,
  note TEXT,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  student_id TEXT,
  internship_id INTEGER REFERENCES internships(id),
  score INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  city TEXT,
  bidang TEXT,
  quota INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id SERIAL PRIMARY KEY,
  workflow_name TEXT,
  status TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  assessment_type TEXT,
  score REAL,
  result TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Placements table
CREATE TABLE IF NOT EXISTS placements (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  company_id INTEGER,
  company_name TEXT,
  match_score INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id),
  user_email TEXT,
  certificate_code TEXT UNIQUE,
  final_score REAL,
  grade TEXT,
  issued_at TIMESTAMP DEFAULT NOW()
);

-- Events log table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event_name TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_user_email ON internships(user_email);
CREATE INDEX IF NOT EXISTS idx_reports_internship_id ON reports(internship_id);
CREATE INDEX IF NOT EXISTS idx_placements_internship_id ON placements(internship_id);
`;
}

// Jalankan migrasi
migrate();