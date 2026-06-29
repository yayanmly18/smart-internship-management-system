const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres123@127.0.0.1:5432/postgres'
});

async function setupDatabase() {
  try {
    // Check if database exists
    const result = await pool.query("SELECT datname FROM pg_database WHERE datname = 'kelompok1_internship'");
    
    if (result.rows.length === 0) {
      console.log('Database "kelompok1_internship" does not exist. Creating...');
      await pool.query('CREATE DATABASE kelompok1_internship');
      console.log('✓ Database "kelompok1_internship" created successfully');
    } else {
      console.log('✓ Database "kelompok1_internship" already exists');
    }

    // Now connect to the new database and create tables
    const dbPool = new Pool({
      connectionString: 'postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship'
    });

    console.log('Creating tables...');
    
    // Users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        nim VARCHAR(50) UNIQUE,
        nip VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        prodi VARCHAR(255),
        year VARCHAR(10),
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        gpa REAL DEFAULT 0,
        semester INTEGER DEFAULT 1,
        organization_exp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Internships table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS internships (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        nim VARCHAR(50),
        prodi VARCHAR(255),
        year VARCHAR(10),
        phone VARCHAR(20),
        motivation TEXT,
        skills TEXT,
        certificates TEXT,
        documents TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        company VARCHAR(255),
        company_bidang VARCHAR(255),
        pembimbing_email VARCHAR(255),
        eligibility_score INTEGER DEFAULT 0,
        eligibility_passed INTEGER DEFAULT 0,
        match_score INTEGER DEFAULT 0,
        final_score REAL DEFAULT 0,
        grade VARCHAR(10) DEFAULT '-',
        certificate_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Internships table created');

    // Reports table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        internship_id INTEGER,
        week INTEGER,
        note TEXT,
        file_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Reports table created');

    // Feedbacks table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        student_id TEXT,
        internship_id INTEGER,
        score INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Feedbacks table created');

    // Companies table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE,
        city VARCHAR(255),
        bidang VARCHAR(255),
        quota INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Companies table created');

    // Workflow logs table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS workflow_logs (
        id SERIAL PRIMARY KEY,
        workflow_name VARCHAR(255),
        status VARCHAR(50),
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Workflow logs table created');

    // Assessments table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        internship_id INTEGER,
        assessment_type VARCHAR(100),
        score REAL,
        result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Assessments table created');

    // Placements table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS placements (
        id SERIAL PRIMARY KEY,
        internship_id INTEGER,
        company_id INTEGER,
        company_name VARCHAR(255),
        match_score INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Placements table created');

    // Certificates table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        internship_id INTEGER,
        user_email VARCHAR(255),
        certificate_code VARCHAR(100) UNIQUE,
        final_score REAL,
        grade VARCHAR(10),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Certificates table created');

    // Events log table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255),
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Events table created');

    await dbPool.end();
    await pool.end();
    
    console.log('\n✓ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();