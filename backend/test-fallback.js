// test-fallback.js
const path = require('path');
const fs = require('fs');

// 1. Load env vars from setup-all.bat
const setupBatPath = path.join(__dirname, '..', 'setup-all.bat');
if (fs.existsSync(setupBatPath)) {
  const bat = fs.readFileSync(setupBatPath, 'utf8');
  for (const line of bat.split('\n')) {
    const m = line.match(/^\s*set\s+([A-Z_][A-Z0-9_]*)=(.+)$/i);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

// Ensure local db config is correct for test
process.env.DATABASE_URL = process.env.KELOMPOK1_DATABASE_URL || 'postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship';
process.env.VFLOW_BASE_URL = process.env.VFLOW_BASE_URL || 'https://sqavflow.vastar.id';

const workflowService = require('./services/workflow.service');

async function runTest() {
  console.log('Testing VFlow-first with Express Fallback...');
  
  const payload = {
    name: 'Fallback Test User',
    nim: '22030999',
    email: `fallback-test-${Date.now()}@kel1.com`,
    password: 'password123',
    prodi: 'Teknik Informatika',
    year: '2022',
    phone: '08123456789',
    motivation: 'To learn fallback pattern',
    skills: 'JS, PostgreSQL'
  };

  try {
    const result = await workflowService.trigger('wf_registration', payload);
    console.log('--- TEST RESULT ---');
    console.log(JSON.stringify(result, null, 2));
    if (result.source === 'express-fallback') {
      console.log('✅ Fallback mechanism worked correctly!');
    } else {
      console.log('⚠️ Result was not from express-fallback. Check logic.');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    process.exit(0);
  }
}

runTest();
