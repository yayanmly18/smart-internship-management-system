const db = require('./integrations/database.client');

async function test() {
  try {
    // Create a test company
    const result = await db.run(
      'INSERT INTO companies (name, city, bidang, quota) VALUES (?,?,?,?)',
      ['Bank Simple', 'Jakarta', 'Keuangan', 3]
    );
    console.log('Created company id:', result.id);

    // Check quota before
    const before = await db.get('SELECT quota FROM companies WHERE name=?', ['Bank Simple']);
    console.log('Quota before:', before?.quota);

    // Decrement quota
    await db.run('UPDATE companies SET quota = MAX(0, quota - 1) WHERE name=?', ['Bank Simple']);
    
    // Check quota after
    const after = await db.get('SELECT quota FROM companies WHERE name=?', ['Bank Simple']);
    console.log('Quota after:', after?.quota);
    console.log('Test', after?.quota === 2 ? 'PASSED' : 'FAILED');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();