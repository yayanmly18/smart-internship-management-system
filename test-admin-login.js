const http = require('http');

const loginData = JSON.stringify({
  email: 'admin@example.com',
  password: 'adminpass',
  role: 'admin'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const json = JSON.parse(data);
      if (json.success && json.token) {
        console.log('\n✓ Login successful!');
        console.log('Token:', json.token);
        
        // Now test dashboard with this token
        testDashboard(json.token);
      } else {
        console.log('\n✗ Login failed');
      }
    } catch (e) {
      console.log('\n✗ Failed to parse response');
    }
  });
});

req.on('error', (error) => {
  console.error('✗ Error:', error.message);
  process.exit(1);
});

req.write(loginData);
req.end();

function testDashboard(token) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dashboard/admin/stats',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n--- Dashboard API Response ---');
      console.log('Status:', res.statusCode);
      console.log('Data:', data);
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('✗ Error:', error.message);
    process.exit(1);
  });

  req.end();
}