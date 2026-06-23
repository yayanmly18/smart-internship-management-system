const http = require('http');

async function test() {
  // Login as admin
  const loginData = JSON.stringify({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });
  const loginRes = await new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.write(loginData); req.end();
  });

  const token = loginRes.data.token;
  console.log('Login success, role:', loginRes.data.role);

  // Fetch pembimbing list
  const pembRes = await new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 3001, path: '/api/auth/pembimbing', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.end();
  });

  console.log('Pembimbing API response:', JSON.stringify(pembRes, null, 2));
}

test().catch(console.error);