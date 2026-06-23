const http = require('http');

async function testApplicantsAPI() {
  // First, login as admin to get token
  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'adminpass',
    role: 'admin'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginResult = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Login response:', loginResult.status, JSON.stringify(loginResult.data, null, 2));

  if (!loginResult.data.token) {
    console.error('No token received from login');
    process.exit(1);
  }

  const token = loginResult.data.token;

  // Now call applicants API
  const applicantsOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/applicants',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const applicantsResult = await new Promise((resolve, reject) => {
    const req = http.request(applicantsOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });

  console.log('\nApplicants API response:', applicantsResult.status);
  console.log('Applicants data:', JSON.stringify(applicantsResult.data, null, 2));
}

testApplicantsAPI().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});