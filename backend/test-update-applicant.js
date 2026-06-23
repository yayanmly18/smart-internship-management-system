const http = require('http');

async function test() {
  // Login fresh
  const loginData = JSON.stringify({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });
  const loginRes = await new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.write(loginData); req.end();
  });

  console.log('Login full response:', JSON.stringify(loginRes, null, 2));
  const token = loginRes?.data?.token || loginRes?.token;
  if (!token) {
    console.error('No token received');
    return;
  }

  // Update applicant - use internshipId 3
  const updateData = JSON.stringify({
    status: 'aktif',
    companyName: 'PT Test',
    pembimbingEmail: 'gs@gmail.com'
  });

  const updateRes = await new Promise((resolve) => {
    const req = http.request({ 
      hostname: 'localhost', 
      port: 3001, 
      path: '/api/auth/applicants/3', 
      method: 'PUT', 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateData)
      } 
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', (err) => resolve({ status: 500, data: { error: err.message } }));
    req.write(updateData);
    req.end();
  });

  console.log('Update response:', updateRes.status);
  console.log('Update data:', JSON.stringify(updateRes.data, null, 2));
}

test().catch(console.error);