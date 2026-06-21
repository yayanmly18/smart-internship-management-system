const AuditModel = require('../models/audit.model');

exports.receiveVFlowLog = async (req, res) => {
  try {
    // Nangkep payload (data) yang dikirim sama mesin VFlow
    const { workflow_id, vrule_id, action, status, data } = req.body;

    // Validasi ringan biar VFlow gak ngirim data kosong
    if (!action || !status) {
      return res.status(400).json({ error: "Action dan Status wajib diisi, Bre!" });
    }

    // Simpan ke database
    const savedLog = await AuditModel.createLog({ workflow_id, vrule_id, action, status, data });

    res.status(201).json({
      message: "Log VFlow berhasil ditangkap dan disimpan!",
      log: savedLog
    });
  } catch (error) {
    console.error("❌ Gagal nyimpen log VFlow:", error);
    res.status(500).json({ error: "Terjadi kesalahan di server." });
  }
};