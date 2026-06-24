const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. CALLER: Menerima Pendaftaran & Trigger VFlow AWS
// ==========================================
app.post("/api/auth/register", async (req, res) => {
  const studentData = req.body;
  console.log("📥 [FRONTEND] Data Pendaftaran Masuk:", studentData);

  try {
    // ...
    console.log("🚀 [BACKEND] Meneruskan data ke Mesin VFlow AWS...");

    const vflowResponse = await fetch(
      "http://54.227.1.76:7799/api/internship/submit?tenant=_default", // ✅ TAMBAHIN ?tenant=_default DI SINI!
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": "_default", // (Biarin aja buat double-security)
        },
        body: JSON.stringify(studentData),
      },
    );
    // ...

    if (!vflowResponse.ok) {
      // ✅ BONGKAR ISI PESAN ERROR DARI AWS
      const errorText = await vflowResponse.text();
      console.error(`🚨 [DEBUG AWS] Detail Error:`, errorText);
      throw new Error(
        `AWS Nolak, Status: ${vflowResponse.status} | Pesan: ${errorText}`,
      );
    }

    console.log("✅ [BACKEND] Mesin AWS berhasil nyala dan memproses log!");

    // Balikin respon sukses ke React Frontend
    res.status(200).json({
      message:
        "Registrasi Berhasil! Mesin VFlow di AWS sedang memproses data lu.",
      status: "REGISTERED",
    });
  } catch (error) {
    console.error("❌ [BACKEND] Gagal trigger VFlow AWS:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ==========================================
// 2. UPSTREAM (WEBHOOK): Menerima Detach Activity dari VFlow
// ==========================================
app.post("/api/webhook/audit", async (req, res) => {
  const logData = req.body;

  // Di sini nantinya kita masukin query INSERT ke PostgreSQL
  console.log(
    "🔥 [VFLOW DETACH] Audit Log Diterima dari AWS lewat Cloudflare:",
  );
  console.log(JSON.stringify(logData, null, 2));

  // Harus langsung return 200 OK biar VFlow tahu log-nya sukses terkirim
  res.status(200).json({ message: "Audit log saved successfully" });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend siap melayani di port ${PORT}`);
  console.log(`🌐 URL untuk Cloudflare Tunnel: http://localhost:${PORT}`);
});
