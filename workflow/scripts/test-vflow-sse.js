#!/usr/bin/env node
/**
 * test-vflow-sse.js
 * Test POST ke VFlow webhook dengan SSE-aware response parsing.
 * VFlow mengirim response dalam format text/event-stream:
 *   data: {"ok":true}\n\n
 *
 * Usage: node workflow/scripts/test-vflow-sse.js
 * Butuh env VFLOW_BASE_URL (atau baca dari setup-all.bat via args)
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ─── Load env dari setup-all.bat ────────────────────────────────────────────
const setupBatPath = path.join(__dirname, '..', '..', 'setup-all.bat');
if (fs.existsSync(setupBatPath)) {
  const bat = fs.readFileSync(setupBatPath, 'utf8');
  for (const line of bat.split('\n')) {
    const m = line.match(/^\s*set\s+([A-Z_][A-Z0-9_]*)=(.+)$/i);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const BASE_URL   = process.env.VFLOW_BASE_URL || 'https://sqavflow.vastar.id';
const ADMIN_KEY  = process.env.VFLOW_ADMIN_KEY || '';
const LOG_TOKEN  = process.env.LOGSTREAM_TOKEN || '';

console.log(`Base URL: ${BASE_URL}`);
console.log(`Admin key set: ${ADMIN_KEY.length > 0}`);
console.log('');

/**
 * POST ke VFlow webhook dengan SSE-aware reader.
 * Mengumpulkan semua `data:` events dari SSE stream.
 */
function postWebhook(urlPath, payload, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL + '/');
    const client = url.protocol === 'https:' ? https : http;
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const bodyBuf = Buffer.from(bodyStr, 'utf8');

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyBuf.length,
        'Accept': 'text/event-stream, application/json, */*',
        'User-Agent': 'kelompok1-sse-test/1.0',
      },
    };

    const req = client.request(options, (res) => {
      console.log(`HTTP ${res.statusCode} ${res.statusMessage}`);
      console.log('Content-Type:', res.headers['content-type'] || '(none)');
      console.log('Transfer-Encoding:', res.headers['transfer-encoding'] || '(none)');
      console.log('');

      const chunks = [];
      let totalBytes = 0;
      const contentType = res.headers['content-type'] || '';
      let resolved = false;
      let dataTimer = null;

      function resolveWithData() {
        if (resolved) return;
        resolved = true;
        if (dataTimer) { clearTimeout(dataTimer); dataTimer = null; }
        const raw = Buffer.concat(chunks);
        const rawText = raw.toString('utf8');
        console.log(`Total bytes received: ${totalBytes}`);
        if (totalBytes === 0) {
          req.destroy();
          return resolve({ ok: false, statusCode: res.statusCode, raw: '', parsed: null, error: 'Empty body' });
        }
        console.log('Raw text:', JSON.stringify(rawText.substring(0, 500)));

        // ── SSE parsing
        if (contentType.includes('text/event-stream')) {
          const events = [];
          for (const line of rawText.split('\n')) {
            const t = line.trim();
            if (t.startsWith('data:')) {
              const jsonStr = t.slice(5).trim();
              if (jsonStr) {
                try { events.push(JSON.parse(jsonStr)); }
                catch { events.push({ raw: jsonStr }); }
              }
            }
          }
          if (events.length > 0) {
            console.log('Parsed SSE events:', JSON.stringify(events, null, 2));
            req.destroy();
            return resolve({ ok: true, statusCode: res.statusCode, raw: rawText, parsed: events[0], events });
          }
          // Try length-prefixed
          if (raw.length > 4) {
            try {
              const parsed = JSON.parse(raw.slice(4).toString('utf8'));
              console.log('Parsed (length-prefixed):', JSON.stringify(parsed, null, 2));
              req.destroy();
              return resolve({ ok: true, statusCode: res.statusCode, raw: rawText, parsed });
            } catch { /* not length-prefixed */ }
          }
          // Raw text might be JSON
          try {
            const parsed = JSON.parse(rawText.trim());
            req.destroy();
            return resolve({ ok: true, statusCode: res.statusCode, raw: rawText, parsed });
          } catch { /* not JSON */ }

          req.destroy();
          return resolve({ ok: false, statusCode: res.statusCode, raw: rawText, parsed: null, error: 'SSE parse failed' });
        }

        // Plain JSON
        try {
          const parsed = JSON.parse(rawText);
          req.destroy();
          return resolve({ ok: true, statusCode: res.statusCode, raw: rawText, parsed });
        } catch {
          req.destroy();
          return resolve({ ok: false, statusCode: res.statusCode, raw: rawText, parsed: null, error: 'JSON parse failed' });
        }
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
        console.log(`[data event] ${chunk.length} bytes: ${chunk.toString('hex').substring(0, 64)}`);
        // For SSE keep-alive, resolve 200ms after last chunk
        if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
          if (dataTimer) clearTimeout(dataTimer);
          dataTimer = setTimeout(resolveWithData, 200);
        }
      });

      res.on('end', resolveWithData);
      res.on('close', () => { if (!resolved) resolveWithData(); });

      // Timeout: if no data after 5s, resolve with empty
      setTimeout(() => {
        if (!resolved && totalBytes === 0) {
          resolved = true;
          req.destroy();
          resolve({ ok: false, statusCode: res.statusCode, raw: '', parsed: null, error: 'Empty body' });
        }
      }, 5000);

      res.on('error', (err) => {
        if (totalBytes > 0 && !resolved) return resolveWithData();
        if (!resolved) { resolved = true; reject(err); }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout after ${timeoutMs}ms`)));
    req.write(bodyBuf);
    req.end();
  });
}

// ─── Main Test Suite ─────────────────────────────────────────────────────────
async function main() {
  const tests = [
    {
      name: '1. Minimal (no framing)',
      path: '/webhook/kelompok1/minimal',
      payload: { test: true, from: 'sse-test' }
    },
    {
      name: '2. Echo Standard (length_prefixed)',
      path: '/webhook/kelompok1/test/echo-standard',
      payload: { test: true }
    },
    {
      name: '3. Register Test (fastpath)',
      path: '/webhook/kelompok1/internship/register-test',
      payload: { name: 'Test Kel1', nim: '22030001', email: 'test@kel1.com' }
    },
    {
      name: '4. Register (fastpath + DB)',
      path: '/webhook/kelompok1/internship/register',
      payload: {
        name: 'SSE Test User',
        nim: '22030099',
        email: `sse-test-${Date.now()}@kel1.com`,
        password: 'test123',
        prodi: 'Teknik Informatika',
        year: '2022',
        phone: '08123456789'
      }
    }
  ];

  for (const test of tests) {
    console.log('═'.repeat(60));
    console.log(`TEST: ${test.name}`);
    console.log(`PATH: ${test.path}`);
    console.log('─'.repeat(60));
    try {
      const result = await postWebhook(test.path, test.payload, 20000);
      if (result.ok && result.parsed) {
        console.log('✅ SUCCESS - Parsed response:', JSON.stringify(result.parsed, null, 2));
      } else if (result.error === 'Empty body') {
        console.log('❌ EMPTY BODY - VFlow returned HTTP 200 tapi 0 bytes');
        console.log('   → Root cause: SSE stream closes before data sent, atau workflow execution error');
        console.log('   → Cek LogStream untuk error internal');
      } else {
        console.log('⚠️  Result:', JSON.stringify(result, null, 2));
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
    console.log('');
    await new Promise(r => setTimeout(r, 500)); // jeda antar request
  }

  console.log('═'.repeat(60));
  console.log('Test selesai.');
  console.log('');
  console.log('LogStream command (untuk debug internal VFlow):');
  console.log(`  curl -N -H "Authorization: Bearer ${LOG_TOKEN}" \\`);
  console.log(`    "${BASE_URL}/logs/vflow-server?tail=100&follow=true"`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
