const fetch = global.fetch;

const BASE = 'http://localhost:3000';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';
  const role = 'admin';

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });

  const loginData = await loginRes.json();
  console.log('Login response:', loginData);

  if (loginData.success) {
    console.log('✓ Login successful!');
    console.log('Token:', loginData.token);
    console.log('User:', loginData.data);
  } else {
    console.log('✗ Login failed:', loginData.message);
  }
}

main();
