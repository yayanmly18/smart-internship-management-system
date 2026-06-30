const fetch = global.fetch || require('node-fetch');

async function main() {
  const url = 'http://localhost:3000/api/auth/login';
  const payloads = [
    { email: 'gs@gmail.com', password: 'test', role: 'pembimbing' },
    { email: 'gs@gmail.com', password: '12345678', role: 'pembimbing' },
    { email: 'gs@gmail.com', password: 'password', role: 'pembimbing' },
    { email: 'gs@gmail.com', password: '', role: 'pembimbing' },
  ];

  for (const p of payloads) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const body = await res.text().catch(() => '<no body>');
      console.log('\nPayload:', p);
      console.log('Status:', res.status);
      console.log('Body:', body);
    } catch (e) {
      console.error('Request failed:', e);
    }
  }
}

main();

