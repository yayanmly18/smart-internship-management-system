const axios = require('axios');
const vflowConfig = require('../config/vflow.config');

function buildHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (vflowConfig.adminKey) {
    headers.Authorization = `Bearer ${vflowConfig.adminKey}`;
    headers['X-Admin-Key'] = vflowConfig.adminKey;
  }

  return headers;
}

function makeUrl(path) {
  if (!path.startsWith('/')) {
    return `${vflowConfig.baseUrl}/${path}`;
  }

  return `${vflowConfig.baseUrl}${path}`;
}

async function health() {
  const url = makeUrl('/api/admin/health');

  const response = await axios.get(url, {
    headers: buildHeaders(),
    timeout: vflowConfig.timeoutMs,
  });

  return response.data;
}

async function listKelompokRoutes() {
  const result = await health();

  const routes = Array.isArray(result.webhook_routes)
    ? result.webhook_routes
        .map((route) => Array.isArray(route) ? route[0] : route)
        .filter(Boolean)
    : [];

  return routes.filter((route) => String(route).includes(vflowConfig.namespace));
}

async function triggerWebhook(path, payload = {}, options = {}) {
  if (!vflowConfig.enabled || vflowConfig.mode === 'local') {
    return {
      skipped: true,
      source: 'vflow',
      reason: 'VFlow disabled or local mode',
      path,
      payload,
    };
  }

  const url = makeUrl(path);

  try {
    const response = await axios.post(url, payload, {
      headers: buildHeaders(options.headers),
      timeout: options.timeoutMs || vflowConfig.timeoutMs,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return {
        ok: true,
        source: 'vflow',
        path,
        statusCode: response.status,
        data: response.data,
      };
    }

    const error = new Error(`VFlow webhook failed: HTTP ${response.status}`);
    error.statusCode = response.status;
    error.responseData = response.data;
    error.path = path;
    throw error;
  } catch (error) {
    if (error.responseData) throw error;

    const wrapped = new Error(`VFlow webhook error: ${error.message}`);
    wrapped.cause = error;
    wrapped.path = path;
    throw wrapped;
  }
}

async function triggerRegistration(payload) {
  return triggerWebhook(vflowConfig.paths.registration, payload);
}

async function triggerRegisterTest(payload) {
  return triggerWebhook(vflowConfig.paths.registerTest, payload);
}

const workflowToPath = {
  wf_registration: vflowConfig.paths.registration,
  wf_eligibility: vflowConfig.paths.eligibility,
  wf_approval: vflowConfig.paths.approval,
  wf_progress_monitoring: vflowConfig.paths.progress,
  wf_certification: vflowConfig.paths.certification,
};

async function triggerWorkflow(workflowName, payload = {}) {
  const path = workflowToPath[workflowName];

  if (!path) {
    throw new Error(`Belum ada mapping VFlow webhook untuk workflow '${workflowName}'`);
  }

  return triggerWebhook(path, payload);
}

module.exports = {
  config: vflowConfig,
  health,
  listKelompokRoutes,
  triggerWebhook,
  triggerRegistration,
  triggerRegisterTest,
  triggerWorkflow,
};