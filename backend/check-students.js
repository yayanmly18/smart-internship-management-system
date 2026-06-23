const db = require('./integrations/database.client');

async function check() {
  try {
    const users = await db.all('SELECT id, name, nim, email, role FROM users WHERE role = ?', ['mahasiswa']);
    console.log('Mahasiswa users count:', users.length);
    console.log('Mahasiswa users:', JSON.stringify(users, null, 2));

    const internships = await db.all('SELECT * FROM internships');
    console.log('\nInternships count:', internships.length);
    console.log('Internships:', JSON.stringify(internships, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

check();