const fetch = global.fetch;

const BASE = 'http://localhost:3001';

async function main() {
  // login first
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';
  const role = 'admin';

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });

  const loginText = await loginRes.text();
  let loginJson;
  try { loginJson = JSON.parse(loginText); } catch { loginJson = null; }

  console.log('[LOGIN] status=', loginRes.status);
  console.log('[LOGIN] body=', loginJson || loginText);

  if (!loginJson || !loginJson.token) {
    console.log('No token; abort');
    process.exit(1);
  }

  const token = loginJson.token;
  const usersRes = await fetch(`${BASE}/api/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const usersText = await usersRes.text();
  let usersJson;
  try { usersJson = JSON.parse(usersText); } catch { usersJson = null; }

  console.log('[USERS] status=', usersRes.status);
  console.log('[USERS] body=', usersJson || usersText);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

