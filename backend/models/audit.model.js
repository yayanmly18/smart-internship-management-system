const db = require('../integrations/database.client');

const AuditModel = {
  // Fungsi untuk nyimpen log asinkronus dari workflow VFlow
  createLog: async (logData) => {
    const { workflow_id, vrule_id, action, status, log_data } = logData;
    const query = `
      INSERT INTO audit_logs (workflow_id, vrule_id, action, status, log_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    // log_data diconvert jadi string kalau bentuknya object/JSON
    const finalLogData = typeof log_data === 'object' ? JSON.stringify(log_data) : log_data;
    
    const values = [workflow_id, vrule_id, action, status, finalLogData];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Fungsi buat ngambil semua history log (biar bisa ditampilin di dashboard Admin)
  getAllLogs: async () => {
    const query = 'SELECT * FROM audit_logs ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }
};

module.exports = AuditModel;