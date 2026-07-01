/**
 * vflow-logger.js
 * Log setiap percobaan akses ke VFlow webhook.
 * Format log: [TIMESTAMP] [ENDPOINT] [STATUS] [FALLBACK:yes/no] [DETAIL]
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'vflow-access.log');

// Pastikan folder logs ada
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Tulis satu baris ke log file (append, tidak menimpa histori).
 */
function writeLine(line) {
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (err) {
    // Logging tidak boleh crash aplikasi
    console.error('[vflow-logger] Failed to write log:', err.message);
  }
}

/**
 * Buat timestamp ISO 8601.
 */
function ts() {
  return new Date().toISOString();
}

/**
 * Log akses ke VFlow yang berhasil.
 * @param {string} endpoint - Path webhook VFlow, e.g. /webhook/kelompok1/internship/register
 * @param {object} [detail] - Optional detail (statusCode, data ringkasan)
 */
function success(endpoint, detail = {}) {
  const statusCode = detail.statusCode || 200;
  const line = `[${ts()}] [${endpoint}] [STATUS:SUCCESS] [HTTP:${statusCode}] [FALLBACK:no] [source:vflow]`;
  writeLine(line);
  console.log(`[vflow-logger] ✅ VFlow OK: ${endpoint} (HTTP ${statusCode})`);
}

/**
 * Log akses ke VFlow yang gagal (sebelum fallback).
 * @param {string} endpoint
 * @param {Error|object} err
 */
function fail(endpoint, err = {}) {
  const errMsg = (err && err.message) ? err.message.substring(0, 200) : String(err);
  const statusCode = err.statusCode || 'ERR';
  const line = `[${ts()}] [${endpoint}] [STATUS:FAILED] [HTTP:${statusCode}] [FALLBACK:pending] [error:${errMsg}]`;
  writeLine(line);
  console.warn(`[vflow-logger] ⚠️  VFlow FAILED: ${endpoint} — ${errMsg}`);
}

/**
 * Log bahwa sistem melakukan fallback ke Express/lokal.
 * @param {string} endpoint - Nama workflow atau path
 * @param {string} [reason]
 */
function fallback(endpoint, reason = 'VFlow unavailable or error') {
  const line = `[${ts()}] [${endpoint}] [STATUS:FALLBACK] [HTTP:N/A] [FALLBACK:yes] [reason:${reason}]`;
  writeLine(line);
  console.warn(`[vflow-logger] 🔄 FALLBACK to Express: ${endpoint} — ${reason}`);
}

/**
 * Log skipped (VFlow dinonaktifkan via env).
 * @param {string} endpoint
 */
function skipped(endpoint) {
  const line = `[${ts()}] [${endpoint}] [STATUS:SKIPPED] [HTTP:N/A] [FALLBACK:yes] [reason:VFLOW_ENABLED=false]`;
  writeLine(line);
}

/**
 * Log raw entry (untuk kasus khusus).
 * @param {string} endpoint
 * @param {string} status
 * @param {string} message
 * @param {boolean} [didFallback=false]
 */
function raw(endpoint, status, message, didFallback = false) {
  const line = `[${ts()}] [${endpoint}] [STATUS:${status}] [HTTP:N/A] [FALLBACK:${didFallback ? 'yes' : 'no'}] [msg:${message.substring(0, 200)}]`;
  writeLine(line);
}

module.exports = {
  success,
  fail,
  fallback,
  skipped,
  raw,
  LOG_FILE,
};
