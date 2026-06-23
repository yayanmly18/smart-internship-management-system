async function test() {
  // Login
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'adminpass', role: 'admin' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status, 'role:', loginData.data?.role);
  
  const token = loginData.data.token;
  console.log('Token received:', !!token);

  // Fetch pembimbing
  const pembRes = await fetch('http://localhost:3001/api/auth/pembimbing', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pembData = await pembRes.json();
  console.log('Pembimbing status:', pembRes.status);
  console.log('Pembimbing data:', JSON.stringify(pembData, null, 2));
}

test().catch(console.error);