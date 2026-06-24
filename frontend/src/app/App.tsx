import { useState } from "react";

export default function App() {
  const [formData, setFormData] = useState({
    nim: "", nama: "", gpa: "", semester: "", certificate_count: ""
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Nembak ke backend Node.js lu 
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    try {
      // ✅ YANG DIGANTI DI SINI: /api/register -> /api/auth/register
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert("✅ Mantap! Pendaftaran sukses, VFlow di AWS langsung jalan di belakang layar!");
      } else {
        alert("⚠️ Backend nolak, cek log terminal backend lu.");
      }
    } catch (err) {
      alert("❌ Gagal konek ke Backend.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold">Demo Pendaftaran Magang</h2>
        <input required placeholder="NIM" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, nim: e.target.value})} />
        <input required placeholder="Nama Lengkap" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, nama: e.target.value})} />
        <input required type="number" step="0.01" placeholder="IPK (misal: 3.6)" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, gpa: e.target.value})} />
        <input required type="number" placeholder="Semester" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, semester: e.target.value})} />
        <input required type="number" placeholder="Jumlah Sertifikat" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, certificate_count: e.target.value})} />
        <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 transition-colors">
          {loading ? "Memproses..." : "Daftar & Trigger VFlow"}
        </button>
      </form>
    </div>
  );
}