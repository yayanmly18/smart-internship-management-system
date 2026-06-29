const http = require('http');

function login(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            resolve(json.data.token);
          } else {
            reject(new Error(json.message));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getStudents(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/internship/pembimbing/students',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('Logging in as pembimbing (yanto@gmail.com)...');
    const token = await login('yanto@gmail.com', 'password123');
    console.log('✓ Login successful!');
    console.log('Token:', token.substring(0, 20) + '...');
    
    console.log('\nFetching students...');
    const result = await getStudents(token);
    console.log('Status:', result.success ? 'Success' : 'Failed');
    console.log('Data:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();