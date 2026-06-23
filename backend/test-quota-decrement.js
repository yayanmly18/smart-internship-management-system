const http = require('http');
const db = require('./integrations/database.client');

async function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  // Reset internship status to pending first
  await db.run('UPDATE internships SET status=? WHERE id=?', ['pending', 3]);
  console.log('Reset internship 3 to pending');

  // Login
  const loginBody = JSON.stringify({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });
  const loginRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  console.log('Login status:', loginRes.status);
  const token = loginRes.data?.token;
  if (!token) { console.error('No token found'); return; }
  console.log('Token obtained');

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Create company with unique name and quota 3
  const companyName = 'Bank Test ' + Date.now();
  const companyBody = JSON.stringify({ name: companyName, city: 'Jakarta', bidang: 'Keuangan', quota: 3 });
  const companyRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/perusahaan/companies', method: 'POST',
    headers: { ...authHeaders, 'Content-Length': Buffer.byteLength(companyBody) }
  }, companyBody);
  console.log('Create company status:', companyRes.status, 'success:', companyRes.data?.success, 'name:', companyName);

  // Update applicant to accepted status with the company
  const updateBody = JSON.stringify({ status: 'aktif', companyName: companyName, pembimbingEmail: 'gs@gmail.com' });
  const updateRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/auth/applicants/3', method: 'PUT',
    headers: { ...authHeaders, 'Content-Length': Buffer.byteLength(updateBody) }
  }, updateBody);
  console.log('Update applicant status:', updateRes.status, 'success:', updateRes.data?.success);

  // Get companies
  const companiesRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/perusahaan/companies', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const company = companiesRes.data?.data?.find(c => c.name === companyName);
  console.log('Company quota:', company?.quota, '(expected: 2)');
  console.log('Test', company?.quota === 2 ? 'PASSED' : 'FAILED');
}

test().catch(console.error);