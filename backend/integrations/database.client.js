const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbConfig = require('../config/db.config');

const dbFile = dbConfig.DB_FILE || path.resolve(__dirname, '..', 'data.sqlite');

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to open SQLite database', err);
    return;
  }
  console.log('Connected to SQLite DB at', dbFile);
});

// Initialize all tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    nim TEXT,
    nip TEXT,
    email TEXT UNIQUE,
    prodi TEXT,
    year TEXT,
    phone TEXT,
    password TEXT,
    role TEXT,
    gpa REAL DEFAULT 0,
    semester INTEGER DEFAULT 1,
    organization_exp INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Internships table
  db.run(`CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Reports table
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id INTEGER,
    week INTEGER,
    note TEXT,
    file_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Feedbacks table
  db.run(`CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    internship_id INTEGER,
    score INTEGER,
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Companies table
  db.run(`CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    city TEXT,
    bidang TEXT,
    quota INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Workflow logs table
  db.run(`CREATE TABLE IF NOT EXISTS workflow_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name TEXT,
    status TEXT,
    payload TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Assessments table (Starlark results)
  db.run(`CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id INTEGER,
    assessment_type TEXT,
    score REAL,
    result TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Placements table
  db.run(`CREATE TABLE IF NOT EXISTS placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id INTEGER,
    company_id INTEGER,
    company_name TEXT,
    match_score INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Certificates table
  db.run(`CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id INTEGER,
    user_email TEXT,
    certificate_code TEXT UNIQUE,
    final_score REAL,
    grade TEXT,
    issued_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Events log table
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT,
    payload TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ id: this.lastID, changes: this.changes });
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

module.exports = { db, run, get, all };