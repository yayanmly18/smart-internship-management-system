const baseUrl = (process.env.VFLOW_BASE_URL || 'https://sqavflow.vastar.id').replace(/\/$/, '');
const namespace = process.env.VFLOW_NAMESPACE || 'kelompok1';

module.exports = {
  enabled: String(process.env.VFLOW_ENABLED || 'true').toLowerCase() !== 'false',
  mode: process.env.VFLOW_MODE || 'remote',
  fallbackLocal: String(process.env.VFLOW_FALLBACK_LOCAL || 'false').toLowerCase() === 'true',
  baseUrl,
  tenant: process.env.VFLOW_TENANT || '_default',
  namespace,
  adminKey: process.env.VFLOW_ADMIN_KEY || '',
  timeoutMs: Number(process.env.VFLOW_TIMEOUT_MS || 20000),
  paths: {
    registerTest: `/webhook/${namespace}/internship/register-test`,
    registration: `/webhook/${namespace}/internship/register`,
    eligibility: `/webhook/${namespace}/internship/eligibility`,
    approval: `/webhook/${namespace}/internship/approval`,
    progress: `/webhook/${namespace}/internship/progress`,
    certification: `/webhook/${namespace}/internship/certification`,
  },
};