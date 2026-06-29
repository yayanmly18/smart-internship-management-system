const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testMahasiswaDashboard() {
  try {
    console.log('=== Testing Mahasiswa Dashboard Data ===\n');
    
    // Test with Yayan Mulyana (shown in screenshot)
    console.log('1. Login as Yayan Mulyana...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'yayanmaulyana845@gmail.com',
      password: 'password123',
      role: 'mahasiswa'
    });
    
    console.log('Login response:', loginRes.data.success ? 'SUCCESS' : 'FAILED');
    if (!loginRes.data.success) {
      console.log('Response:', loginRes.data);
      return;
    }
    
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get mahasiswa dashboard
    console.log('\n2. Fetching mahasiswa dashboard...');
    const dashRes = await axios.get(`${BASE_URL}/dashboard/mahasiswa/dashboard`, { headers });
    console.log('Dashboard response keys:', Object.keys(dashRes.data.data || {}));
    console.log('\nFull dashboard data:');
    console.log(JSON.stringify(dashRes.data.data, null, 2));
    
    // Get mahasiswa evaluation (grades)
    console.log('\n3. Fetching mahasiswa evaluation...');
    const evalRes = await axios.get(`${BASE_URL}/dashboard/mahasiswa/evaluation`, { headers });
    console.log('Evaluation response keys:', Object.keys(evalRes.data.data || {}));
    console.log('\nEvaluation data:');
    console.log(JSON.stringify(evalRes.data.data, null, 2));
    
    // Get mahasiswa reports
    console.log('\n4. Fetching mahasiswa reports...');
    const reportsRes = await axios.get(`${BASE_URL}/dashboard/mahasiswa/reports`, { headers });
    console.log('Reports response keys:', Object.keys(reportsRes.data.data || {}));
    console.log('\nReports data:');
    console.log(JSON.stringify(reportsRes.data.data, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

testMahasiswaDashboard();