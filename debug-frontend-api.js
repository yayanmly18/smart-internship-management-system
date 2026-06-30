// Simulasi apa yang dilakukan frontend
const token = localStorage.getItem('token');
console.log('Token from localStorage:', token);

if (token) {
  const headers = { 'Authorization': `Bearer ${token}` };
  console.log('Headers:', headers);
  
  // Test API call
  fetch('/api/dashboard/admin/stats', { headers })
    .then(res => {
      console.log('Response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('Response data:', data);
    })
    .catch(err => {
      console.error('Error:', err);
    });
} else {
  console.log('No token found!');
}