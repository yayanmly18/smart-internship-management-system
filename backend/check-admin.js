const db = require('./integrations/database.client');

async function check() {
  try {
    const admins = await db.all('SELECT id, name, email, role FROM users WHERE role = ?', ['admin']);
    console.log('Admin users count:', admins.length);
    console.log('Admin users:', JSON.stringify(admins, null, 2));

    const allUsers = await db.all('SELECT id, name, email, role FROM users');
    console.log('\nAll users count:', allUsers.length);
    console.log('All users:', JSON.stringify(allUsers, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

check();