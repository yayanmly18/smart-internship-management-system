/**
 * vflow.config.js
 * Konfigurasi VFlow integration untuk Smart Internship Management System.
 * Semua path webhook menggunakan prefix kelompok1.
 */

const baseUrl   = (process.env.VFLOW_BASE_URL || 'https://sqavflow.vastar.id').replace(/\/$/, '');
const namespace = process.env.VFLOW_NAMESPACE || 'kelompok1';

module.exports = {
  // Aktifkan VFlow: set VFLOW_ENABLED=false untuk disable penuh (pure Express fallback)
  enabled: String(process.env.VFLOW_ENABLED || 'true').toLowerCase() !== 'false',

  // mode: 'remote' = coba VFlow dulu, 'local' = skip VFlow langsung ke Express
  mode: process.env.VFLOW_MODE || 'remote',

  // fallbackLocal: jika true dan VFlow gagal, otomatis fallback ke Express lokal
  fallbackLocal: String(process.env.VFLOW_FALLBACK_LOCAL || 'true').toLowerCase() === 'true',

  baseUrl,
  tenant: process.env.VFLOW_TENANT || '_default',
  namespace,
  adminKey: process.env.VFLOW_ADMIN_KEY || '',
  timeoutMs: Number(process.env.VFLOW_TIMEOUT_MS || 20000),

  // Webhook paths — semua dengan prefix kelompok1
  paths: {
    // Test routes
    registerTest:   `/webhook/${namespace}/internship/register-test`,
    minimal:        `/webhook/${namespace}/minimal`,

    // Business workflows
    registration:   `/webhook/${namespace}/internship/register`,
    eligibility:    `/webhook/${namespace}/internship/eligibility`,
    adminVerify:    `/webhook/${namespace}/internship/admin-verify`,
    approval:       `/webhook/${namespace}/internship/approval`,
    placement:      `/webhook/${namespace}/internship/placement`,
    progress:       `/webhook/${namespace}/internship/progress`,
    evaluation:     `/webhook/${namespace}/internship/evaluation`,
    certification:  `/webhook/${namespace}/internship/certification`,
  },
};