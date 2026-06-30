const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testFrontendData() {
  try {
    // Login as admin first to see what data exists
    console.log('1. Testing admin login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'adminpass',
      role: 'admin'
    });
    
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get all users
    console.log('\n2. Getting all users...');
    const users = await axios.get(`${BASE_URL}/auth/users`, { headers });
    console.log('Users:', JSON.stringify(users.data.data, null, 2));
    
    // Get all internships
    console.log('\n3. Getting all internships...');
    try {
      const internships = await axios.get(`${BASE_URL}/internship`, { headers });
      console.log('Internships count:', internships.data.data?.length || 0);
    } catch (e) {
      console.log('Internship endpoint error (continuing...)');
    }
    
    // Login as pembimbing to test their dashboard (based on screenshots)
    console.log('\n4. Testing pembimbing login...');
    const pLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'yanto@gmail.com',
      password: 'password123',
      role: 'pembimbing'
    });
    console.log('Pembimbing login success:', pLogin.data.success);
    console.log('Pembimbing login response:', JSON.stringify(pLogin.data, null, 2));
    
    if (pLogin.data.success) {
      const pToken = pLogin.data.token;
      const pHeaders = { Authorization: `Bearer ${pToken}` };
      
      // Test pembimbing dashboard stats
      console.log('\n5. Testing pembimbing dashboard stats...');
      try {
        const pStats = await axios.get(`${BASE_URL}/dashboard/pembimbing/stats`, { pHeaders });
        console.log('Pembimbing stats:', JSON.stringify(pStats.data.data, null, 2));
        console.log('Average score value:', pStats.data.data?.averageScore);
        console.log('Average score type:', typeof pStats.data.data?.averageScore);
      } catch (e) {
        console.log('Pembimbing stats error:', e.message);
      }
      
      // Test pembimbing pending feedback
      console.log('\n6. Testing pembimbing pending feedback...');
      try {
        const pending = await axios.get(`${BASE_URL}/dashboard/pembimbing/pending-feedback`, { pHeaders });
        console.log('Pending feedback count:', pending.data.data?.pendingFeedback?.length || 0);
        if (pending.data.data?.pendingFeedback?.length > 0) {
          console.log('First feedback item keys:', Object.keys(pending.data.data.pendingFeedback[0]));
        }
      } catch (e) {
        console.log('Pending feedback error:', e.message);
      }
    }
    
    // Test reports stats
    console.log('\n5. Testing reports stats...');
    const stats = await axios.get(`${BASE_URL}/reports/stats`, { headers });
    console.log('Stats:', JSON.stringify(stats.data.data, null, 2));
    
    // Check if there are any feedbacks in DB
    console.log('\n6. Checking feedbacks directly...');
    const db = require('./integrations/database.client');
    const allFeedbacks = await db.all('SELECT * FROM feedbacks');
    console.log('Total feedbacks in DB:', allFeedbacks.length);
    console.log('Feedbacks:', JSON.stringify(allFeedbacks, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

testFrontendData();