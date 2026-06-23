const fetch = global.fetch;

const BASE = 'http://localhost:3001';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'adminpass';

  for (const role of ['admin','mahasiswa','pembimbing']) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password, role })
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text);} catch { json = null; }
    console.log('role=',role,'status=',res.status,'body=',json||text);
  }
}

main().catch(e=>{console.error(e);process.exit(1);});

