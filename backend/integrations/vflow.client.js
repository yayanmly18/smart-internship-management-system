/**
 * vflow.client.js
 * Client untuk memanggil VFlow webhook endpoint.
 * Mendukung SSE (text/event-stream) response yang digunakan VFlow,
 * logging ke vflow-access.log, dan retry sekali jika gagal.
 */

const https  = require('https');
const http   = require('http');
const vflowConfig = require('../config/vflow.config');
const vflowLogger = require('./vflow-logger');

// ─── URL helpers ─────────────────────────────────────────────────────────────

function makeUrl(urlPath) {
  const base = vflowConfig.baseUrl.replace(/\/$/, '');
  if (!urlPath.startsWith('/')) return `${base}/${urlPath}`;
  return `${base}${urlPath}`;
}

function buildHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream, application/json, */*',
    ...extraHeaders,
  };
  // Admin API endpoints need the key; webhook endpoints don't
  return headers;
}

// ─── SSE / length-prefixed response parser ───────────────────────────────────

/**
 * Parse VFlow response body.
 * VFlow bisa mengirim dalam beberapa format:
 *   1. text/event-stream SSE: "data: {...}\n\n"
 *   2. length-prefixed binary: [4-byte BE length][json]
 *   3. Plain JSON (application/json)
 */
function parseVFlowResponse(rawBuf, contentType) {
  if (!rawBuf || rawBuf.length === 0) return null;

  const ct = (contentType || '').toLowerCase();

  // ── Format 1: SSE text/event-stream ───────────────────────────────────────
  if (ct.includes('text/event-stream') || ct.includes('text/plain')) {
    const rawText = rawBuf.toString('utf8');
    const results = [];
    for (const line of rawText.split('\n')) {
      const t = line.trim();
      if (t.startsWith('data:')) {
        const jsonStr = t.slice(5).trim();
        if (jsonStr) {
          try { results.push(JSON.parse(jsonStr)); }
          catch { /* skip malformed */ }
        }
      }
    }
    if (results.length > 0) return results[0];

    // Fallback: try raw text as JSON
    try { return JSON.parse(rawText.trim()); }
    catch { /* not JSON */ }

    // Fallback: length-prefixed inside SSE stream?
    if (rawBuf.length > 4) {
      const sliced = rawBuf.slice(4);
      try { return JSON.parse(sliced.toString('utf8')); }
      catch { /* not length-prefixed */ }
    }

    return null;
  }

  // ── Format 2: length-prefixed binary ──────────────────────────────────────
  if (rawBuf.length > 4) {
    const declaredLen = rawBuf.readUInt32BE(0);
    if (declaredLen > 0 && declaredLen <= rawBuf.length - 4) {
      try {
        return JSON.parse(rawBuf.slice(4, 4 + declaredLen).toString('utf8'));
      } catch { /* not length-prefixed */ }
    }
  }

  // ── Format 3: plain JSON ────────────────────────────────────────────────────
  try { return JSON.parse(rawBuf.toString('utf8')); }
  catch { /* not JSON */ }

  return null;
}

// ─── Core HTTP POST (SSE-aware) ───────────────────────────────────────────────

/**
 * POST ke VFlow webhook dengan SSE-aware response reading.
 * VFlow mengirim text/event-stream yang tidak ditutup (SSE keep-alive).
 * Kita resolve segera setelah data diterima, tidak tunggu stream 'end'.
 * @returns {Promise<{ok, statusCode, data, rawBytes, contentType}>}
 */
function httpPost(urlPath, payload, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const fullUrl = makeUrl(urlPath);
    const url = new URL(fullUrl);
    const client = url.protocol === 'https:' ? https : http;

    const bodyBuf = Buffer.from(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      'utf8'
    );

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ''),
      headers: {
        ...buildHeaders(),
        'Content-Length': bodyBuf.length,
        'User-Agent': 'kelompok1-vflow-client/1.0',
      },
    };

    let resolved = false;

    function resolveOnce(value) {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    }

    function rejectOnce(err) {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    }

    const req = client.request(options, (res) => {
      const chunks = [];
      let totalBytes = 0;
      const contentType = res.headers['content-type'] || '';

      // ── SSE keep-alive: resolve setelah data diterima atau timeout 5s ─────
      // VFlow tidak menutup SSE stream setelah mengirim event.
      // Kita resolve segera ketika data mulai masuk, lalu destroy stream.
      let dataTimer = null;

      function tryResolveWithData() {
        if (dataTimer) { clearTimeout(dataTimer); dataTimer = null; }
        const rawBuf = Buffer.concat(chunks);
        const parsed = parseVFlowResponse(rawBuf, contentType);
        req.destroy(); // tutup koneksi SSE keep-alive
        resolveOnce({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          contentType,
          rawBytes: totalBytes,
          data: parsed || rawBuf.toString('utf8'),
          parsed,
        });
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;

        // Jika sudah ada data dan SSE stream (keep-alive), schedule resolve
        // dalam 200ms untuk beri waktu semua chunk tiba.
        if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
          if (dataTimer) clearTimeout(dataTimer);
          dataTimer = setTimeout(tryResolveWithData, 200);
        }
      });

      res.on('end', () => {
        // Stream ditutup secara normal (bukan SSE keep-alive)
        tryResolveWithData();
      });

      // Timeout jika tidak ada data sama sekali dalam 5s
      const noDataTimer = setTimeout(() => {
        if (totalBytes === 0) {
          // Tetap resolve dengan rawBytes=0 agar caller bisa fallback
          req.destroy();
          resolveOnce({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            contentType,
            rawBytes: 0,
            data: null,
            parsed: null,
          });
        }
      }, 5000);

      res.on('close', () => {
        clearTimeout(noDataTimer);
        if (!resolved) tryResolveWithData();
      });

      res.on('error', (err) => {
        clearTimeout(noDataTimer);
        if (dataTimer) clearTimeout(dataTimer);
        // If we got some data before error, resolve with it
        if (totalBytes > 0 && !resolved) {
          tryResolveWithData();
        } else {
          rejectOnce(err);
        }
      });
    });

    req.on('error', (err) => {
      // ECONNRESET expected when we destroy() the SSE connection
      if (err.code === 'ECONNRESET' && resolved) return;
      rejectOnce(err);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`VFlow request timeout after ${timeoutMs}ms to ${urlPath}`));
    });

    req.write(bodyBuf);
    req.end();
  });
}

// ─── Admin GET (untuk health) ─────────────────────────────────────────────────

function httpGet(urlPath, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const fullUrl = makeUrl(urlPath);
    const url = new URL(fullUrl);
    const client = url.protocol === 'https:' ? https : http;

    const headers = { 'User-Agent': 'kelompok1-vflow-client/1.0' };
    if (vflowConfig.adminKey) headers['x-api-key'] = vflowConfig.adminKey;

    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ''),
      headers,
    };

    const req = client.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch { resolve(Buffer.concat(chunks).toString('utf8')); }
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout ${urlPath}`)));
    req.end();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function health() {
  return httpGet('/api/admin/health');
}

async function listKelompokRoutes() {
  const result = await health();
  const routes = Array.isArray(result.webhook_routes)
    ? result.webhook_routes
        .map(r => Array.isArray(r) ? r[0] : r)
        .filter(Boolean)
    : [];
  return routes.filter(r => String(r).includes(vflowConfig.namespace));
}

/**
 * Trigger a VFlow webhook.
 * Logs every attempt to vflow-access.log.
 * Retries once on failure.
 */
async function triggerWebhook(urlPath, payload = {}, options = {}) {
  const timeoutMs = options.timeoutMs || vflowConfig.timeoutMs;

  if (!vflowConfig.enabled || vflowConfig.mode === 'local') {
    vflowLogger.skipped(urlPath);
    return { skipped: true, source: 'local', reason: 'VFLOW_ENABLED=false or local mode', path: urlPath };
  }

  // ── Attempt (with 1 retry) ─────────────────────────────────────────────────
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await httpPost(urlPath, payload, timeoutMs);

      if (!result.ok) {
        const err = new Error(`VFlow HTTP ${result.statusCode}`);
        err.statusCode = result.statusCode;
        err.responseData = result.data;
        err.path = urlPath;
        throw err;
      }

      // Log success
      vflowLogger.success(urlPath, { statusCode: result.statusCode });

      return {
        ok: true,
        source: 'vflow',
        path: urlPath,
        statusCode: result.statusCode,
        data: result.parsed || result.data,
        rawBytes: result.rawBytes,
      };

    } catch (err) {
      lastErr = err;
      if (attempt === 1) {
        console.warn(`[vflow.client] attempt ${attempt} failed for ${urlPath}: ${err.message} — retrying…`);
        await new Promise(r => setTimeout(r, 1000)); // 1s backoff
      }
    }
  }

  // Both attempts failed
  vflowLogger.fail(urlPath, lastErr);

  const wrapped = new Error(`VFlow webhook failed after 2 attempts: ${lastErr.message}`);
  wrapped.cause = lastErr;
  wrapped.statusCode = lastErr.statusCode;
  wrapped.responseData = lastErr.responseData;
  wrapped.path = urlPath;
  throw wrapped;
}

async function triggerRegistration(payload) {
  return triggerWebhook(vflowConfig.paths.registration, payload);
}

async function triggerRegisterTest(payload) {
  return triggerWebhook(vflowConfig.paths.registerTest, payload);
}

// Mapping workflow name → VFlow webhook path
const workflowToPath = {
  wf_registration:        vflowConfig.paths.registration,
  wf_eligibility:         vflowConfig.paths.eligibility,
  wf_admin_verification:  vflowConfig.paths.adminVerify,
  wf_approval:            vflowConfig.paths.approval,
  wf_placement:           vflowConfig.paths.placement,
  wf_progress_monitoring: vflowConfig.paths.progress,
  wf_evaluation:          vflowConfig.paths.evaluation,
  wf_certification:       vflowConfig.paths.certification,
};

async function triggerWorkflow(workflowName, payload = {}) {
  const wfPath = workflowToPath[workflowName];
  if (!wfPath) {
    throw new Error(`No VFlow webhook mapping for workflow '${workflowName}'`);
  }
  return triggerWebhook(wfPath, payload);
}

module.exports = {
  config: vflowConfig,
  health,
  listKelompokRoutes,
  triggerWebhook,
  triggerRegistration,
  triggerRegisterTest,
  triggerWorkflow,
  // Exposed for testing
  parseVFlowResponse,
  httpPost,
};