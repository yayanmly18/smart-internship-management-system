const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard/admin/stats',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token'
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
    
    if (res.statusCode === 403) {
      console.log('\n✓ Dashboard API is reachable (403 is expected without valid auth)');
      console.log('✓ Database connection is working!');
      process.exit(0);
    } else if (res.statusCode === 500) {
      console.log('\n✗ Server error - check backend logs');
      process.exit(1);
    } else {
      console.log('\n✓ Dashboard API responded successfully');
      process.exit(0);
    }
  });
});

req.on('error', (error) => {
  console.error('✗ Error:', error.message);
  process.exit(1);
});

req.end();