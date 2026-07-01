const http = require('http');
const fs = require('fs');
const path = require('path');

const BOUNDARY = '----FormBoundary' + Math.random().toString(36).substring(2);

function buildMultipart(fields, files) {
    const parts = [];
    
    // Add text fields
    for (const [key, value] of Object.entries(fields)) {
        parts.push(Buffer.from(`--${BOUNDARY}\r\n`));
        parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
        parts.push(Buffer.from(String(value), 'utf-8'));
        parts.push(Buffer.from('\r\n'));
    }
    
    // Add file fields
    for (const [key, filePath] of Object.entries(files)) {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);
        parts.push(Buffer.from(`--${BOUNDARY}\r\n`));
        parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${fileName}"\r\n`));
        parts.push(Buffer.from(`Content-Type: application/octet-stream\r\n\r\n`));
        parts.push(fileContent);
        parts.push(Buffer.from('\r\n'));
    }
    
    parts.push(Buffer.from(`--${BOUNDARY}--\r\n`));
    return Buffer.concat(parts);
}

// Create a dummy PDF file for testing
const dummyPdfPath = path.join(__dirname, 'uploads', 'test_doc.pdf');
const dummyPdfDir = path.dirname(dummyPdfPath);
if (!fs.existsSync(dummyPdfDir)) fs.mkdirSync(dummyPdfDir, { recursive: true });
// Small PDF header
const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');
fs.writeFileSync(dummyPdfPath, minimalPdf);

const fields = {
    name: 'Test Mahasiswa Baru',
    nim: '23012345',
    email: 'yayanmaulyana845@gmail.com',
    phone: '08123456789',
    alamat: 'Jl. Test No. 1',
    prodi: 'Teknik Informatika',
    year: '2024',
    semester: '6',
    ipk: '3.5',
    sks: '100',
    motivation: 'Ingin belajar dan berkembang di dunia kerja nyata',
    skills: 'JavaScript,React,Node.js',
    certificates: 'TOEFL 500',
};

const files = {
    documents: dummyPdfPath,  // use same file for testing
};

const body = buildMultipart(fields, files);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/internship/register',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
        'Content-Length': body.length,
    },
};

console.log('Submitting internship registration...');
console.log('Fields:', JSON.stringify(fields));

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const parsed = JSON.parse(data);
        console.log('\n=== RESPONSE ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', JSON.stringify(parsed, null, 2));
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(body);
req.end();