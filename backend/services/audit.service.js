const db = require("../integrations/database.client");

/**
 * Audit Service - Mencatat semua aktivitas ke database
 */
exports.log = async ({ action, data, userId, internshipId }) => {
  try {
    const result = await db.run(
      'INSERT INTO workflow_logs (workflow_name, status, payload) VALUES (?,?,?)',
      [action || 'audit', 'logged', JSON.stringify({ userId, internshipId, data, timestamp: new Date().toISOString() })]
    );
    console.log(`[AUDIT] ${action} logged (id: ${result.id})`);
    return { id: result.id, logged: true };
  } catch (err) {
    console.error(`[AUDIT] Failed to log ${action}:`, err);
    return { logged: false, error: err.message };
  }
};