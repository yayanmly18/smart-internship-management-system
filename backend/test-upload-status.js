const fetch = global.fetch;

const BASE = 'http://localhost:3001';

async function main() {
  const email = 'yayanmaulyana845@gmail.com';
  const password = '12345678';
  const role = 'mahasiswa';

  // 1) login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });

  const loginJson = await loginRes.json();
  if (!loginJson?.token) {
    console.log('Login failed:', loginRes.status, loginJson);
    process.exit(1);
  }

  const token = loginJson.token;
  console.log('Login OK, role:', loginJson?.data?.role);

  // 2) status before upload
  const statusBeforeRes = await fetch(`${BASE}/api/internship/status?role=${encodeURIComponent(role)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statusBefore = await statusBeforeRes.json();
  console.log('Status before upload:', statusBefore);

  // 3) upload report (workflow trigger)
  const uploadRes = await fetch(`${BASE}/api/workflow/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ week: 7, note: 'test upload (script)' })
  });
  const uploadJson = await uploadRes.json();
  console.log('Upload response:', uploadRes.status, uploadJson);

  // 4) status after upload
  const statusAfterRes = await fetch(`${BASE}/api/internship/status?role=${encodeURIComponent(role)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statusAfter = await statusAfterRes.json();
  console.log('Status after upload:', statusAfter);

  // 5) quick db sanity check (best-effort, without additional endpoints)
  console.log('DONE');
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});

