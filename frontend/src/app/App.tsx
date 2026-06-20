import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, FileText, ClipboardCheck, TrendingUp, Award, Bell,
  LogOut, Upload, Download, CheckCircle, Clock, User, Building2,
  GraduationCap, Star, Calendar, Menu, X, Eye, EyeOff, ArrowRight,
  Shield, MessageSquare, Target, ChevronDown, ChevronRight, Search,
  Filter, MoreHorizontal, AlertCircle, Zap, Users, BookOpen,
  Settings, PieChart, BarChart2, Layers, Hash, Mail, Phone,
  MapPin, Edit2, Trash2, Plus, RefreshCw, ExternalLink, Info,
  CheckSquare, XSquare, Send, Paperclip, Flag, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "mahasiswa" | "pembimbing" | "admin";
type MahasiswaPage = "dashboard" | "registration" | "status" | "monitoring" | "evaluation" | "certificate";
type PembimbingPage = "p-dashboard" | "p-students" | "p-feedback" | "p-schedule";
type AdminPage = "a-dashboard" | "a-applicants" | "a-companies" | "a-reports" | "a-users";
type AuthPage = "login" | "register";
type AppPage = AuthPage | MahasiswaPage | PembimbingPage | AdminPage;

// ─── Utils ────────────────────────────────────────────────────────────────────
function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const weeklyData = [
  { week: "W1", laporan: 1, kehadiran: 5 }, { week: "W2", laporan: 1, kehadiran: 5 },
  { week: "W3", laporan: 1, kehadiran: 4 }, { week: "W4", laporan: 1, kehadiran: 5 },
  { week: "W5", laporan: 1, kehadiran: 5 }, { week: "W6", laporan: 1, kehadiran: 4 },
  { week: "W7", laporan: 0, kehadiran: 0 }, { week: "W8", laporan: 0, kehadiran: 0 },
];

const adminMonthlyData = [
  { bulan: "Jan", daftar: 12, lulus: 9 }, { bulan: "Feb", daftar: 18, lulus: 14 },
  { bulan: "Mar", daftar: 24, lulus: 20 }, { bulan: "Apr", daftar: 31, lulus: 25 },
  { bulan: "Mei", daftar: 28, lulus: 22 }, { bulan: "Jun", daftar: 35, lulus: 30 },
];

const statusPieData = [
  { name: "Aktif", value: 48, color: "#2563EB" },
  { name: "Selesai", value: 32, color: "#10B981" },
  { name: "Seleksi", value: 15, color: "#F59E0B" },
  { name: "Ditolak", value: 5, color: "#EF4444" },
];

const applicants = [
  { id: "2310631170057", nama: "Yayan Mulyana", prodi: "Informatika", ipk: "3.72", semester: 6, status: "aktif", perusahaan: "PT. RAG", pembimbing: "Dr. Hendra K." },
  { id: "22031082", nama: "Sari Dewi Kusuma", prodi: "Sistem Informasi", ipk: "3.88", semester: 6, status: "seleksi", perusahaan: "-", pembimbing: "Dr. Rina S." },
  { id: "22030091", nama: "Bagas Prasetyo", prodi: "Teknik Komputer", ipk: "3.55", semester: 7, status: "aktif", perusahaan: "CV. Kreasi Media", pembimbing: "Prof. Ahmad W." },
  { id: "22031103", nama: "Faishal", prodi: "Ilmu Komputer", ipk: "3.91", semester: 6, status: "selesai", perusahaan: "PT. Bank Digital", pembimbing: "Dr. Hendra K." },
  { id: "21029055", nama: "Rizky Firmansyah", prodi: "Informatika", ipk: "3.44", semester: 7, status: "ditolak", perusahaan: "-", pembimbing: "-" },
  { id: "22031067", nama: "Firdaus", prodi: "Sistem Informasi", ipk: "3.79", semester: 6, status: "aktif", perusahaan: "PT. Gojek Indonesia", pembimbing: "Prof. Ahmad W." },
];

const myStudents = [
  { id: "2310631170057", nama: "Yayan Mulyana", perusahaan: "PT. RAG", progress: 68, laporan: 6, nilai: 87.5, status: "aktif" },
  { id: "22031103", nama: "Faishal", perusahaan: "PT. Bank Digital", progress: 100, laporan: 8, nilai: 92.0, status: "selesai" },
  { id: "22031067", nama: "Firdaus", perusahaan: "PT. Gojek Indonesia", progress: 45, laporan: 4, nilai: 83.0, status: "aktif" },
];

const reportHistory = [
  { week: "Minggu 6", date: "18 Jun 2026", status: "reviewed", score: 88, feedback: "Progres sangat baik, lanjutkan dokumentasi API endpoint." },
  { week: "Minggu 5", date: "10 Jun 2026", status: "reviewed", score: 85, feedback: "Pastikan mencatat semua hambatan teknis yang ditemui." },
  { week: "Minggu 4", date: "03 Jun 2026", status: "reviewed", score: 90, feedback: "Laporan lengkap dan terstruktur dengan baik." },
  { week: "Minggu 3", date: "27 Mei 2026", status: "reviewed", score: 87, feedback: "Baik, tingkatkan inisiatif dalam diskusi tim." },
  { week: "Minggu 2", date: "20 Mei 2026", status: "reviewed", score: 84, feedback: "Sesuai target minggu ini." },
  { week: "Minggu 1", date: "13 Mei 2026", status: "reviewed", score: 86, feedback: "Adaptasi yang baik di lingkungan kerja baru." },
];

const notifData = [
  { id: 1, text: "Feedback laporan minggu 6 sudah tersedia", time: "2j lalu", read: false, type: "feedback" },
  { id: 2, text: "Jadwal evaluasi akhir: 15 Juli 2026", time: "1h lalu", read: false, type: "schedule" },
  { id: 3, text: "Laporan minggu 5 disetujui pembimbing", time: "1 hari", read: true, type: "approval" },
  { id: 4, text: "Pengingat: unggah laporan minggu 7 sebelum Jumat", time: "2 hari", read: true, type: "reminder" },
];

const timeline = [
  { date: "18 Jun 2026", title: "Laporan Minggu 6 Diunggah", type: "upload" },
  { date: "16 Jun 2026", title: "Feedback Pembimbing Diterima", type: "feedback" },
  { date: "10 Jun 2026", title: "Laporan Minggu 5 Diunggah", type: "upload" },
  { date: "05 Jun 2026", title: "Penempatan Perusahaan Dikonfirmasi", type: "placement" },
  { date: "28 Mei 2026", title: "Persetujuan Pembimbing Diterima", type: "approval" },
  { date: "20 Mei 2026", title: "Seleksi Berkas Lulus", type: "selection" },
];

// ─── Shared Components ────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aktif: "bg-blue-50 text-blue-700 border-blue-200",
    selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
    seleksi: "bg-amber-50 text-amber-700 border-amber-200",
    ditolak: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    reviewed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const label: Record<string, string> = {
    aktif: "Aktif", selesai: "Selesai", seleksi: "Seleksi", ditolak: "Ditolak",
    pending: "Menunggu", approved: "Disetujui", reviewed: "Direview", draft: "Draft",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", map[status] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
      {label[status] ?? status}
    </span>
  );
}

function StatCard({ label, value, sub, icon, color, trend }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string; trend?: string }) {
  const bg: Record<string, string> = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600", rose: "bg-rose-50 text-rose-600" };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg[color])}>
          {icon}
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold flex items-center gap-0.5", trend.startsWith("+") ? "text-emerald-600" : "text-red-500")}>
            {trend.startsWith("+") ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotifPanel({ onClose }: { onClose: () => void }) {
  const unread = notifData.filter(n => !n.read).length;
  const iconMap: Record<string, React.ReactNode> = {
    feedback: <MessageSquare size={14} className="text-blue-500" />,
    schedule: <Calendar size={14} className="text-violet-500" />,
    approval: <CheckCircle size={14} className="text-emerald-500" />,
    reminder: <AlertCircle size={14} className="text-amber-500" />,
  };
  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">Notifikasi</span>
          {unread > 0 && <span className="w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>}
        </div>
        <button className="text-xs text-blue-600 font-semibold hover:text-blue-700">Tandai semua</button>
      </div>
      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
        {notifData.map(n => (
          <div key={n.id} className={cn("px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors", !n.read && "bg-blue-50/30")}>
            <div className="flex items-start gap-3">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", !n.read ? "bg-blue-100" : "bg-slate-100")}>
                {iconMap[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 font-medium leading-snug">{n.text}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100 text-center">
        <button className="text-xs text-blue-600 font-semibold hover:text-blue-700">Lihat semua notifikasi</button>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, onLogout, role }: { title: string; subtitle?: string; onLogout: () => void; role: Role }) {
  const [notif, setNotif] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifData.filter(n => !n.read).length;
  const names = { mahasiswa: "Yayan Mulyana", pembimbing: "Dr. Hendra Kusuma", admin: "Admin Sistem" };
  const initials = { mahasiswa: "AR", pembimbing: "HK", admin: "AS" };
  const roles = { mahasiswa: "Mahasiswa · S6", pembimbing: "Dosen Pembimbing", admin: "Administrator" };

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setNotif(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 flex-shrink-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-bold text-slate-900 truncate" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setNotif(v => !v)}
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all relative"
          >
            <Bell size={16} />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>}
          </button>
          {notif && <NotifPanel onClose={() => setNotif(false)} />}
        </div>
        <div className="h-6 w-px bg-slate-100" />
        <div className="flex items-center gap-2.5 pl-1">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", role === "admin" ? "bg-violet-500" : role === "pembimbing" ? "bg-emerald-500" : "bg-blue-500")}>
            {initials[role]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">{names[role]}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{roles[role]}</p>
          </div>
          <button onClick={onLogout} className="ml-1 w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all" title="Keluar">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onRegister }: { onLogin: (r: Role) => void; onRegister: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("mahasiswa");

  const roles: { id: Role; label: string; color: string; icon: React.ReactNode }[] = [
    { id: "mahasiswa", label: "Mahasiswa", color: "blue", icon: <GraduationCap size={16} /> },
    { id: "pembimbing", label: "Pembimbing", color: "emerald", icon: <BookOpen size={16} /> },
    { id: "admin", label: "Admin", color: "violet", icon: <Shield size={16} /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[520px] relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {/* Blur orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p>
              <p className="text-blue-200 text-xs">Smart Internship</p>
            </div>
          </div>

          <div className="my-auto">
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Sistem Manajemen<br />Magang Cerdas
            </h1>
            <p className="text-blue-200 text-base leading-relaxed mb-10">
              Platform terintegrasi untuk mengelola seluruh proses magang mahasiswa dari pendaftaran hingga sertifikat digital.
            </p>
            <div className="space-y-3">
              {[
                { icon: <Target size={15} />, t: "Pendaftaran & seleksi otomatis terdigitalisasi" },
                { icon: <TrendingUp size={15} />, t: "Monitoring progres magang secara real-time" },
                { icon: <Award size={15} />, t: "Sertifikat digital terverifikasi blockchain" },
                { icon: <Users size={15} />, t: "Manajemen mahasiswa, pembimbing & perusahaan" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">{f.icon}</div>
                  <span className="text-blue-100 text-sm">{f.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-auto bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-blue-100 text-sm italic leading-relaxed">"Inovasi membedakan seorang pemimpin dari pengikut."</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 text-xs font-bold">SJ</div>
              <div>
                <p className="text-white text-xs font-semibold">Steve Jobs</p>
                <p className="text-blue-300 text-[11px]">Co-Founder Apple</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><GraduationCap size={18} className="text-white" /></div>
            <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Masuk ke Akun</h2>
            <p className="text-slate-500 text-sm mt-1">Pilih peran dan login dengan akun anda</p>
          </div>

          {/* Role tabs */}
          <div className="flex rounded-xl bg-slate-200/60 p-1 gap-1 mb-5">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  selectedRole === r.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={selectedRole === "mahasiswa" ? "nim@mahasiswa.ac.id" : selectedRole === "pembimbing" ? "dosen@kampus.ac.id" : "admin@nextern.ac.id"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Password</label>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Lupa password?</button>
                </div>
                <div className="relative">
                  <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="rounded accent-blue-600" /> Ingat saya selama 30 hari
              </label>
              <button
                onClick={() => onLogin(selectedRole)}
                className={cn(
                  "w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md",
                  selectedRole === "admin" ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200" :
                    selectedRole === "pembimbing" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
                      "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                Masuk sebagai {selectedRole === "mahasiswa" ? "Mahasiswa" : selectedRole === "pembimbing" ? "Pembimbing" : "Admin"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Belum punya akun?{" "}
            <button onClick={onRegister} className="text-blue-600 font-bold hover:text-blue-700">Daftar Sekarang</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterPage({ onBack }: { onBack: () => void }) {
  const prodiList = ["Teknik Informatika", "Sistem Informasi", "Teknik Komputer", "Ilmu Komputer", "Teknologi Informasi"];
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all">
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Buat Akun Mahasiswa</h2>
            <p className="text-xs text-slate-400">Daftar untuk memulai program magang</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            {[
              { l: "Nama Lengkap", p: "Nama sesuai KTP", col: 2, t: "text" },
              { l: "NIM", p: "22031234", col: 1, t: "text" },
              { l: "Email Kampus", p: "nim@mahasiswa.ac.id", col: 1, t: "email" },
              { l: "Program Studi", p: "", col: 2, t: "select" },
              { l: "Angkatan", p: "2022", col: 1, t: "text" },
              { l: "No. HP", p: "+62 812-xxxx-xxxx", col: 1, t: "text" },
              { l: "Password", p: "Min. 8 karakter", col: 1, t: "password" },
              { l: "Konfirmasi Password", p: "Ulangi password", col: 1, t: "password" },
            ].map(f => (
              <div key={f.l} className={f.col === 2 ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">{f.l}</label>
                {f.t === "select" ? (
                  <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all">
                    <option value="">Pilih Program Studi</option>
                    {prodiList.map(p => <option key={p}>{p}</option>)}
                  </select>
                ) : (
                  <input type={f.t} placeholder={f.p} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-blue-600 rounded" />
              <span className="text-xs text-blue-700 leading-relaxed">
                Saya menyetujui <span className="font-semibold underline cursor-pointer">Syarat & Ketentuan</span> dan <span className="font-semibold underline cursor-pointer">Kebijakan Privasi</span> Nextern. Data saya akan digunakan untuk keperluan administrasi magang.
              </span>
            </label>
          </div>
          <button onClick={onBack} className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2">
            Daftar Sekarang <ArrowRight size={15} />
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">Sudah punya akun? <button onClick={onBack} className="text-blue-600 font-semibold">Masuk</button></p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAHASISWA SECTION
// ══════════════════════════════════════════════════════════════════════════════

const mNav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "registration", label: "Pendaftaran", icon: FileText },
  { id: "status", label: "Status Magang", icon: ClipboardCheck },
  { id: "monitoring", label: "Monitoring", icon: TrendingUp },
  { id: "evaluation", label: "Evaluasi", icon: Star },
  { id: "certificate", label: "Sertifikat", icon: Award },
];

function MSidebar({ page, setPage, collapsed, setCollapsed }: { page: MahasiswaPage; setPage: (p: MahasiswaPage) => void; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  return (
    <aside className={cn("flex flex-col h-screen bg-slate-900 transition-all duration-300 flex-shrink-0", collapsed ? "w-[60px]" : "w-56")}>
      <div className="flex items-center gap-2.5 px-3 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={17} className="text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Mahasiswa</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className={cn("text-slate-500 hover:text-white transition-colors", collapsed && "mx-auto")}>
          <Menu size={15} />
        </button>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {!collapsed && <p className="text-slate-600 text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Menu</p>}
        {mNav.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id as MahasiswaPage)}
              className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all", active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white", collapsed && "justify-center")}
              title={collapsed ? item.label : undefined}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className={cn("p-2 border-t border-white/5", collapsed && "flex justify-center")}>
        {collapsed
          ? <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">YM</div>
          : <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">YM</div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Yayan Mulyana</p>
              <p className="text-slate-400 text-[11px]">NIM 2310631170057</p>
            </div>
          </div>
        }
      </div>
    </aside>
  );
}

// Mahasiswa — Dashboard
function MDashboard({ setPage }: { setPage: (p: MahasiswaPage) => void }) {
  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 bg-white rounded-full" />
          <div className="absolute bottom-4 right-24 w-20 h-20 bg-white rounded-full" />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-1"> Hola Selamat Datang</p>
            <h2 className="text-xl font-extrabold mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Yayan Mulyana</h2>
            <p className="text-blue-200 text-sm">Informatika · Semester 6 · NIM 2310631170057</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Magang Aktif
              </span>
              <span className="bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-blue-100">
                PT. RAG
              </span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-4xl font-black">68%</p>
            <p className="text-blue-200 text-xs mt-0.5">Progress Magang</p>
            <div className="w-24 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden ml-auto">
              <div className="h-full bg-white rounded-full" style={{ width: "68%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Progress Magang" value="68%" sub="6 dari 8 minggu berjalan" icon={<TrendingUp size={17} />} color="blue" trend="+5%" />
        <StatCard label="Laporan Dikirim" value="6/8" sub="2 laporan tersisa" icon={<FileText size={17} />} color="emerald" />
        <StatCard label="Nilai Sementara" value="87.5" sub="Predikat: Sangat Baik" icon={<Star size={17} />} color="amber" trend="+2.1" />
        <StatCard label="Hari Tersisa" value="42" sub="Berakhir 15 Jul 2026" icon={<Calendar size={17} />} color="violet" />
      </div>

      {/* Progress breakdown + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Progres & Laporan</h3>
            <Badge status="aktif" />
          </div>
          <div className="flex items-center gap-5 mb-5">
            {/* Donut */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#EFF6FF" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#2563EB" strokeWidth="4"
                  strokeDasharray="60 40" strokeLinecap="round" style={{ transition: "stroke-dasharray 1s" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-sm font-extrabold text-slate-900">68%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {[
                { label: "Kehadiran", val: 95, color: "bg-emerald-500" },
                { label: "Laporan Mingguan", val: 75, color: "bg-blue-500" },
                { label: "Penilaian Pembimbing", val: 80, color: "bg-violet-500" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{item.label}</span><span className="font-bold text-slate-700">{item.val}%</span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-50 pt-4">
            <p className="text-xs text-slate-500 font-semibold mb-2">Laporan per Minggu</p>
            <ResponsiveContainer width="100%" height={72}>
              <BarChart data={weeklyData} barGap={3} barSize={12}>
                <CartesianGrid vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0", padding: "6px 10px" }} />
                <Bar dataKey="laporan" fill="#2563EB" radius={[4, 4, 0, 0]} name="Laporan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Aktivitas Terbaru</h3>
            <button className="text-xs text-blue-600 font-semibold">Semua →</button>
          </div>
          <div className="space-y-0">
            {timeline.map((item, i) => {
              const colors: Record<string, string> = { upload: "bg-blue-500", feedback: "bg-violet-500", placement: "bg-emerald-500", approval: "bg-emerald-500", selection: "bg-amber-500" };
              return (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", colors[item.type] ?? "bg-slate-300")} />
                    {i < timeline.length - 1 && <div className="w-px bg-slate-100 flex-1 mt-1" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 leading-snug">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Aksi Cepat</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Upload Laporan", icon: <Upload size={18} />, page: "monitoring", bg: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
            { label: "Cek Status", icon: <ClipboardCheck size={18} />, page: "status", bg: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
            { label: "Lihat Nilai", icon: <Star size={18} />, page: "evaluation", bg: "bg-amber-50 text-amber-600 hover:bg-amber-100" },
            { label: "Sertifikat", icon: <Award size={18} />, page: "certificate", bg: "bg-violet-50 text-violet-600 hover:bg-violet-100" },
          ].map(a => (
            <button key={a.label} onClick={() => setPage(a.page as MahasiswaPage)}
              className={cn("flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-transparent transition-all text-center", a.bg)}>
              {a.icon}
              <span className="text-xs font-semibold">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mahasiswa — Registration (4-step wizard)
function MRegistration() {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState(["React.js", "Node.js", "Python"]);
  const [ns, setNs] = useState("");
  const steps = ["Data Diri", "Akademik", "Keahlian", "Dokumen"];

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => step > i + 1 && setStep(i + 1)}>
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                  step === i + 1 ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                    step > i + 1 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                  {step > i + 1 ? <CheckCircle size={13} /> : i + 1}
                </div>
                <span className={cn("text-xs font-semibold hidden sm:block", step === i + 1 ? "text-blue-600" : step > i + 1 ? "text-emerald-600" : "text-slate-300")}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={cn("flex-1 h-px mx-2", step > i + 1 ? "bg-emerald-200" : "bg-slate-100")} />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Data Diri Pribadi</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{ l: "Nama Lengkap", p: "Yayan Mulyana", col: 2 }, { l: "NIM", p: "2310631170057", col: 1 }, { l: "No. HP", p: "+62 812-3456-7890", col: 1 }, { l: "Alamat", p: "Jl. 01 Pahlawan Karwang", col: 2 }].map(f => (
                <div key={f.l} className={f.col === 2 ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">{f.l}</label>
                  <input defaultValue={f.p} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Informasi Akademik</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{ l: "Program Studi", v: "Teknik Informatika" }, { l: "Semester", v: "6" }, { l: "IPK", v: "3.72" }, { l: "SKS Tempuh", v: "96" }].map(f => (
                <div key={f.l}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">{f.l}</label>
                  <input defaultValue={f.v} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Bidang Magang Diminati</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 transition-all">
                  {["Backend Development", "Frontend Development", "Data Science", "DevOps & Cloud", "Mobile Development"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Motivasi Magang</label>
                <textarea rows={3} placeholder="Jelaskan motivasi Anda..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all resize-none" />
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Keahlian & Sertifikasi</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Keahlian Teknis</label>
              <div className="flex flex-wrap gap-2 mb-2.5">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
                    {s} <button onClick={() => setSkills(skills.filter(x => x !== s))} className="text-blue-400 hover:text-blue-700"><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={ns} onChange={e => setNs(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && ns.trim()) { setSkills([...skills, ns.trim()]); setNs(""); } }} placeholder="Tambah keahlian baru..." className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                <button onClick={() => { if (ns.trim()) { setSkills([...skills, ns.trim()]); setNs(""); } }} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Tambah</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Sertifikasi</label>
              <div className="space-y-2">
                {["AWS Cloud Practitioner – Amazon 2024", "Google Data Analytics – Google 2023"].map(c => (
                  <div key={c} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2"><Award size={14} className="text-amber-500" /><span className="text-sm text-slate-700">{c}</span></div>
                    <button className="text-slate-300 hover:text-red-500"><X size={13} /></button>
                  </div>
                ))}
                <button className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> Tambah Sertifikasi
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Upload Dokumen</h3>
            <div className="space-y-2">
              {[
                { l: "Transkrip Nilai (PDF)", s: "done", sz: "1.4 MB" },
                { l: "Curriculum Vitae (PDF)", s: "done", sz: "890 KB" },
                { l: "Surat Pengantar Kampus", s: "pending", sz: "" },
                { l: "Pas Foto (JPG/PNG)", s: "done", sz: "245 KB" },
              ].map(d => (
                <div key={d.l} className={cn("flex items-center justify-between p-4 rounded-xl border transition-colors", d.s === "done" ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 hover:border-blue-200")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", d.s === "done" ? "bg-emerald-100" : "bg-slate-100")}>
                      <FileText size={16} className={d.s === "done" ? "text-emerald-600" : "text-slate-400"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{d.l}</p>
                      <p className="text-xs text-slate-400">{d.sz || "Belum diunggah"}</p>
                    </div>
                  </div>
                  {d.s === "done"
                    ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle size={13} /> Terunggah</span>
                    : <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"><Upload size={12} /> Upload</button>
                  }
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={cn("px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors", step === 1 && "opacity-30 cursor-not-allowed")}>Kembali</button>
          <div className="flex items-center gap-1">
            {steps.map((_, i) => <div key={i} className={cn("h-1.5 rounded-full transition-all", step === i + 1 ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200")} />)}
          </div>
          <button onClick={() => setStep(Math.min(4, step + 1))} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
            {step === 4 ? "Kirim Pendaftaran" : "Lanjut"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Mahasiswa — Status
function MStatus() {
  const stages = [
    { label: "Pendaftaran Dikirim", date: "15 Mei 2026", desc: "Berkas pendaftaran berhasil dikirim dan sedang diproses admin.", done: true },
    { label: "Seleksi Berkas", date: "20 Mei 2026", desc: "Berkas Anda lulus seleksi administrasi dengan skor 91/100.", done: true },
    { label: "Persetujuan Pembimbing", date: "28 Mei 2026", desc: "Dr. Ir. Hendra Kusuma, M.T. menyetujui Anda sebagai mahasiswa bimbingan.", done: true },
    { label: "Penempatan Perusahaan", date: "05 Jun 2026", desc: "Ditempatkan di PT. RAG, Divisi Backend Engineering.", done: true },
    { label: "Evaluasi Akhir", date: "15 Jul 2026", desc: "Evaluasi akhir dilaksanakan pada akhir periode magang.", done: false },
    { label: "Penerbitan Sertifikat", date: "22 Jul 2026", desc: "Sertifikat digital diterbitkan setelah evaluasi akhir.", done: false },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Status Magang Saat Ini</h3>
            <p className="text-xs text-slate-400 mt-0.5">Periode: 12 Mei – 15 Juli 2026</p>
          </div>
          <Badge status="aktif" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[{ l: "Tahap Selesai", v: "4/6", c: "text-slate-900" }, { l: "Progres Total", v: "68%", c: "text-blue-700" }, { l: "Hari Tersisa", v: "42", c: "text-slate-900" }].map(s => (
            <div key={s.l} className="p-3 rounded-xl bg-slate-50 text-center">
              <p className={cn("text-lg font-extrabold", s.c)}>{s.v}</p>
              <p className="text-[11px] text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Informasi Penempatan</h3>
        <div className="flex items-start gap-4 mt-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900">PT. RAG</p>
            <p className="text-sm text-slate-500">Divisi Backend Engineering</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin size={11} /> Bandung</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Pembimbing Akademik</p>
            <p className="text-sm font-bold text-slate-900 mt-1">Dr. Hendra Kusuma, M.T.</p>
            <p className="text-xs text-slate-400">hendra.k@kampus.ac.id</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Pembimbing Lapangan</p>
            <p className="text-sm font-bold text-slate-900 mt-1">Budi Santoso, S.T.</p>
            <p className="text-xs text-slate-400">budi.s@solusidi.id</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Alur Proses Magang</h3>
        {stages.map((s, i) => (
          <div key={i} className="flex gap-4 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", s.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
                {s.done ? <CheckCircle size={18} /> : <Clock size={18} />}
              </div>
              {i < stages.length - 1 && <div className={cn("w-px flex-1 mt-2", s.done ? "bg-emerald-200" : "bg-slate-100")} />}
            </div>
            <div className="flex-1 pt-1.5 pb-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-bold", s.done ? "text-slate-900" : "text-slate-400")}>{s.label}</p>
                <Badge status={s.done ? "approved" : "pending"} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{s.date}</p>
              <p className={cn("text-xs mt-1.5 leading-relaxed", s.done ? "text-slate-500" : "text-slate-300")}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mahasiswa — Monitoring
function MMonitoring() {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Upload Laporan Minggu 7</h3>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-1"><Clock size={11} /> Batas: Jum, 27 Jun 2026</span>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); setUploaded(true); }}
          onClick={() => setUploaded(!uploaded)}
          className={cn("border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all", dragging ? "border-blue-500 bg-blue-50" : uploaded ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40")}
        >
          {uploaded ? (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle size={24} className="text-emerald-600" /></div>
              <p className="text-sm font-bold text-emerald-700">laporan_minggu7_yayan.pdf</p>
              <p className="text-xs text-emerald-500">1.2 MB · Siap dikirim</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto"><Upload size={22} className="text-slate-400" /></div>
              <p className="text-sm font-semibold text-slate-600">Seret file atau klik untuk memilih</p>
              <p className="text-xs text-slate-400">PDF, DOCX · Maks. 10 MB</p>
            </div>
          )}
        </div>
        {uploaded && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Mengunggah...</span><span>100%</span></div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full w-full" /></div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <input placeholder="Catatan untuk pembimbing..." className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 transition-all" />
          <button className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"><Send size={14} /> Kirim</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ l: "Laporan Terkirim", v: "6/8", c: "text-slate-900" }, { l: "Rata-rata Nilai", v: "88.3", c: "text-blue-700" }, { l: "Feedback Diterima", v: "6", c: "text-emerald-700" }].map(s => (
          <div key={s.l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <p className={cn("text-2xl font-extrabold", s.c)} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.v}</p>
            <p className="text-xs text-slate-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Riwayat Laporan</h3>
          <button className="text-xs text-blue-600 font-semibold">Filter</button>
        </div>
        <div className="divide-y divide-slate-50">
          {reportHistory.map((r, i) => (
            <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.week}</p>
                    <p className="text-xs text-slate-400">{r.date}</p>
                    <div className="mt-2 flex items-start gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <MessageSquare size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 leading-snug">{r.feedback}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge status="reviewed" />
                  <span className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{r.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mahasiswa — Evaluation
function MEvaluation() {
  const comps = [
    { label: "Kehadiran & Kedisiplinan", weight: 20, score: 95, color: "bg-emerald-500", textColor: "text-emerald-700" },
    { label: "Nilai Pembimbing Akademik", weight: 25, score: 85, color: "bg-blue-500", textColor: "text-blue-700" },
    { label: "Nilai Pembimbing Lapangan", weight: 35, score: 88, color: "bg-violet-500", textColor: "text-violet-700" },
    { label: "Kualitas Laporan", weight: 20, score: 82, color: "bg-amber-500", textColor: "text-amber-700" },
  ];
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-gradient-to-br from-blue-700 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Nilai Akhir Magang</p>
            <p className="text-5xl font-black mt-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>87.5</p>
            <p className="text-blue-100 text-sm mt-1">Predikat: <span className="font-bold text-white">Sangat Memuaskan</span></p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center">
              <p className="text-4xl font-black">A</p>
              <p className="text-blue-200 text-xs">Grade</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Rincian Penilaian</h3>
        <div className="space-y-5">
          {comps.map(c => (
            <div key={c.label}>
              <div className="flex items-center justify-between mb-2">
                <div><p className="text-sm font-semibold text-slate-800">{c.label}</p><p className="text-xs text-slate-400">Bobot {c.weight}%</p></div>
                <div className="text-right"><p className="text-xl font-extrabold text-slate-900">{c.score}</p><p className="text-xs text-slate-400">dari 100</p></div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", c.color)} style={{ width: `${c.score}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">Nilai Akhir (Weighted Average)</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">87.5</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center">A</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mahasiswa — Certificate
function MCertificate() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center"><Clock size={22} className="text-amber-500" /></div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 text-sm">Sertifikat Belum Tersedia</p>
          <p className="text-xs text-slate-400 mt-0.5">Magang masih aktif — sertifikat diterbitkan setelah evaluasi akhir (15 Jul 2026)</p>
        </div>
        <Badge status="pending" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Preview Sertifikat</h3>
          <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">Pratinjau</span>
        </div>
        {/* Certificate */}
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #1D4ED8 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          {/* Top bar */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 h-2" />
          <div className="p-8 relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center"><GraduationCap size={20} className="text-white" /></div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900 tracking-wide">UNIVERSITAS SINGAPERBANGSA KARAWANG</p>
                <p className="text-xs text-slate-500">Fakultas Ilmu Komputer · Program Magang Nextern</p>
              </div>
            </div>
            <div className="border-t border-b border-blue-100/60 py-5 my-4">
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase mb-3">Sertifikat Magang</p>
              <p className="text-xs text-slate-400 mb-3">Dengan bangga memberikan penghargaan ini kepada:</p>
              <p className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Yayan Mulyana</p>
              <p className="text-sm text-slate-500 mt-1">NIM: 2310631170057 · Teknik Informatika</p>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Telah berhasil menyelesaikan Program Magang di<br />
              <strong className="text-slate-800">PT. RAG</strong><br />
              Divisi Backend Engineering<br />
              Periode <strong>12 Mei – 15 Juli 2026</strong>
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-blue-700 text-white rounded-xl px-5 py-2.5 text-center">
                <p className="text-[10px] text-blue-200 uppercase tracking-widest">Nilai</p>
                <p className="text-2xl font-black">87.5</p>
              </div>
              <div className="bg-white border-2 border-blue-200 rounded-xl px-5 py-2.5 text-center">
                <p className="text-[10px] text-blue-400 uppercase tracking-widest">Grade</p>
                <p className="text-2xl font-black text-blue-700">A</p>
              </div>
            </div>
            <div className="flex items-end justify-between border-t border-slate-200 pt-4">
              <div className="text-center">
                <div className="h-px w-24 bg-slate-400 mb-1" />
                <p className="text-[10px] font-bold text-slate-600">Dr. Hendra Kusuma</p>
                <p className="text-[9px] text-slate-400">Pembimbing Akademik</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-1 bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] mb-1"><Shield size={9} /> Terverifikasi</div>
                <p className="text-[9px] text-slate-400 font-mono">CERT-UTI-2026-2310631170057</p>
              </div>
              <div className="text-center">
                <div className="h-px w-24 bg-slate-400 mb-1" />
                <p className="text-[10px] font-bold text-slate-600">Prof. Dr. Siti Rahma</p>
                <p className="text-[9px] text-slate-400">Kepala Program Studi</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 h-1.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Unduh Sertifikat</h3>
        <div className="grid grid-cols-2 gap-3">
          {[{ l: "PDF (A4)", icon: <Download size={15} /> }, { l: "PNG Resolusi Tinggi", icon: <Download size={15} /> }].map(b => (
            <button key={b.l} disabled className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-300 text-sm font-semibold cursor-not-allowed">{b.icon}{b.l}</button>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">Tersedia setelah evaluasi selesai · 15 Juli 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Persyaratan Kelulusan</h3>
        <div className="space-y-2.5">
          {[
            { l: "Kehadiran minimal 80%", ok: true, v: "95% ✓" },
            { l: "Semua laporan mingguan dikirim", ok: false, v: "6/8 laporan" },
            { l: "Evaluasi pembimbing selesai", ok: false, v: "Belum" },
            { l: "Nilai akhir minimal 70", ok: true, v: "87.5 (sementara)" },
            { l: "Laporan akhir diserahkan", ok: false, v: "Belum" },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {r.ok ? <CheckCircle size={15} className="text-emerald-500" /> : <Clock size={15} className="text-slate-300" />}
                <span className={cn("text-sm", r.ok ? "text-slate-700" : "text-slate-400")}>{r.l}</span>
              </div>
              <span className={cn("text-xs font-semibold", r.ok ? "text-emerald-600" : "text-slate-400")}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mahasiswa Shell
function MahasiswaShell({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<MahasiswaPage>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const meta: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Selamat datang di Nextern" },
    registration: { title: "Pendaftaran Magang", subtitle: "Lengkapi data pendaftaran Anda" },
    status: { title: "Status Magang", subtitle: "Pantau perkembangan proses" },
    monitoring: { title: "Monitoring Progres", subtitle: "Upload laporan & lihat feedback" },
    evaluation: { title: "Evaluasi Akhir", subtitle: "Rincian nilai dan penilaian" },
    certificate: { title: "Sertifikat Digital", subtitle: "Unduh sertifikat magang" },
  };
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <MSidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Topbar title={meta[page].title} subtitle={meta[page].subtitle} onLogout={onLogout} role="mahasiswa" />
        <main className="flex-1 overflow-y-auto p-5">
          {page === "dashboard" && <MDashboard setPage={setPage} />}
          {page === "registration" && <MRegistration />}
          {page === "status" && <MStatus />}
          {page === "monitoring" && <MMonitoring />}
          {page === "evaluation" && <MEvaluation />}
          {page === "certificate" && <MCertificate />}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PEMBIMBING SECTION
// ══════════════════════════════════════════════════════════════════════════════

const pNav = [
  { id: "p-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "p-students", label: "Mahasiswa Saya", icon: Users },
  { id: "p-feedback", label: "Beri Feedback", icon: MessageSquare },
  { id: "p-schedule", label: "Jadwal Evaluasi", icon: Calendar },
];

function PSidebar({ page, setPage, collapsed, setCollapsed }: { page: PembimbingPage; setPage: (p: PembimbingPage) => void; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  return (
    <aside className={cn("flex flex-col h-screen bg-slate-900 transition-all duration-300 flex-shrink-0", collapsed ? "w-[60px]" : "w-56")}>
      <div className="flex items-center gap-2.5 px-3 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><BookOpen size={16} className="text-white" /></div>
        {!collapsed && <div className="flex-1 min-w-0"><p className="text-white font-extrabold text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p><p className="text-slate-400 text-[11px] mt-0.5">Pembimbing</p></div>}
        <button onClick={() => setCollapsed(!collapsed)} className={cn("text-slate-500 hover:text-white", collapsed && "mx-auto")}><Menu size={15} /></button>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && <p className="text-slate-600 text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Menu</p>}
        {pNav.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id as PembimbingPage)}
              className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all", active ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white", collapsed && "justify-center")}
              title={collapsed ? item.label : undefined}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className={cn("p-2 border-t border-white/5", collapsed && "flex justify-center")}>
        {collapsed ? <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">HK</div>
          : <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">HK</div>
            <div className="min-w-0"><p className="text-white text-xs font-semibold truncate">Dr. Hendra Kusuma</p><p className="text-slate-400 text-[11px]">Pembimbing</p></div>
          </div>
        }
      </div>
    </aside>
  );
}

function PDashboard() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-8 top-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute right-20 bottom-2 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-emerald-100 text-xs font-medium mb-1">Dashboard Pembimbing</p>
          <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Dr. Hendra Kusuma, M.T.</h2>
          <p className="text-emerald-100 text-sm mt-1">Program Studi Teknik Informatika · NIP 197205122006041001</p>
          <div className="flex gap-2 mt-3">
            <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold">3 Mahasiswa Aktif</span>
            <span className="bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-emerald-100">2 Laporan Perlu Direview</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Mahasiswa" value="3" sub="1 selesai magang" icon={<Users size={17} />} color="emerald" />
        <StatCard label="Laporan Masuk" value="16" sub="14 sudah direview" icon={<FileText size={17} />} color="blue" />
        <StatCard label="Perlu Feedback" value="2" sub="Laporan menunggu" icon={<AlertCircle size={17} />} color="amber" />
        <StatCard label="Rata-rata Nilai" value="87.5" sub="Semua mahasiswa" icon={<Star size={17} />} color="violet" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Mahasiswa Bimbingan</h3>
        <div className="space-y-3">
          {myStudents.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {s.nama.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{s.nama}</p>
                <p className="text-xs text-slate-400">{s.perusahaan}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{s.progress}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-extrabold text-slate-900">{s.nilai}</p>
                <p className="text-xs text-slate-400">Nilai</p>
                <Badge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PStudents() {
  return (
    <div className="space-y-4">
      {myStudents.map(s => (
        <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {s.nama.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-bold text-slate-900">{s.nama}</p>
                <p className="text-sm text-slate-500">NIM {s.id}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={11} />{s.perusahaan}</p>
              </div>
            </div>
            <Badge status={s.status} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[{ l: "Progres", v: `${s.progress}%` }, { l: "Laporan", v: `${s.laporan}/8` }, { l: "Nilai", v: s.nilai.toString() }].map(stat => (
              <div key={stat.l} className="p-3 rounded-xl bg-slate-50 text-center">
                <p className="text-lg font-extrabold text-slate-900">{stat.v}</p>
                <p className="text-[11px] text-slate-400">{stat.l}</p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress}%` }} />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 flex items-center justify-center gap-1.5"><MessageSquare size={13} /> Beri Feedback</button>
            <button className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-1.5"><Eye size={13} /> Lihat Laporan</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PFeedback() {
  const [sel, setSel] = useState(0);
  const pending = [
    { student: "Yayan Mulyana", week: "Minggu 7", date: "25 Jun 2026", excerpt: "Minggu ini saya menyelesaikan implementasi REST API untuk modul autentikasi menggunakan JWT. Saya juga mulai mempelajari Redis untuk caching..." },
    { student: "Firdaus", week: "Minggu 4", date: "24 Jun 2026", excerpt: "Laporan minggu keempat berisi progres pengembangan dashboard analitik menggunakan React dan Recharts. Tantangan yang dihadapi adalah..." },
  ];
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {pending.map((p, i) => (
          <button key={i} onClick={() => setSel(i)} className={cn("text-left p-4 rounded-2xl border transition-all", sel === i ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-200")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">{p.week}</span>
              <span className="text-[11px] text-slate-400">{p.date}</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{p.student}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.excerpt}</p>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Isi Laporan — {pending[sel].student}</h3>
          <Badge status="pending" />
        </div>
        <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm text-slate-700 leading-relaxed border border-slate-100">
          {pending[sel].excerpt} implementasi cache untuk mempercepat response API sebesar 40%. Testing dilakukan menggunakan Postman dan Jest. Rencana minggu depan adalah melanjutkan dokumentasi API menggunakan Swagger.
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Nilai Laporan (0–100)</label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} defaultValue={88} className="flex-1 accent-emerald-600" />
              <span className="text-lg font-extrabold text-slate-900 w-10 text-right">88</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Komentar Pembimbing</label>
            <textarea rows={4} defaultValue="Progres sangat baik! Implementasi JWT dan Redis caching menunjukkan pemahaman yang matang tentang backend architecture. Lanjutkan dokumentasi API dengan Swagger sesuai rencana." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 transition-all resize-none" />
          </div>
          <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"><Send size={14} /> Kirim Feedback</button>
        </div>
      </div>
    </div>
  );
}

function PSchedule() {
  const schedules = [
    { date: "15 Jul 2026", time: "09.00–10.30", student: "Yayan Mulyana", type: "Evaluasi Akhir", status: "scheduled", place: "Ruang Dosen Lt. 3" },
    { date: "15 Jul 2026", time: "11.00–12.00", student: "Firdaus", type: "Evaluasi Tengah", status: "scheduled", place: "Online via Zoom" },
    { date: "22 Jul 2026", time: "09.00–10.00", student: "Faishal", type: "Sidang Sertifikat", status: "done", place: "Aula Utama" },
  ];
  return (
    <div className="max-w-xl mx-auto space-y-3">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Jadwal Evaluasi</h3>
        <div className="space-y-3">
          {schedules.map((s, i) => (
            <div key={i} className={cn("p-4 rounded-xl border transition-all", s.status === "done" ? "border-slate-100 bg-slate-50" : "border-blue-100 bg-blue-50/40")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.status === "done" ? "bg-slate-100" : "bg-blue-100")}>
                    <Calendar size={18} className={s.status === "done" ? "text-slate-400" : "text-blue-600"} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.student}</p>
                    <p className="text-xs text-slate-500">{s.type}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.date} · {s.time}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {s.place}</p>
                  </div>
                </div>
                <Badge status={s.status === "done" ? "selesai" : "aktif"} />
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Tambah Jadwal</button>
      </div>
    </div>
  );
}

function PembimbingShell({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<PembimbingPage>("p-dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const meta: Record<string, { title: string; subtitle: string }> = {
    "p-dashboard": { title: "Dashboard Pembimbing", subtitle: "Ringkasan mahasiswa bimbingan" },
    "p-students": { title: "Mahasiswa Saya", subtitle: "Detail progres setiap mahasiswa" },
    "p-feedback": { title: "Beri Feedback", subtitle: "Review laporan & beri penilaian" },
    "p-schedule": { title: "Jadwal Evaluasi", subtitle: "Kelola jadwal bimbingan" },
  };
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <PSidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Topbar title={meta[page].title} subtitle={meta[page].subtitle} onLogout={onLogout} role="pembimbing" />
        <main className="flex-1 overflow-y-auto p-5">
          {page === "p-dashboard" && <PDashboard />}
          {page === "p-students" && <PStudents />}
          {page === "p-feedback" && <PFeedback />}
          {page === "p-schedule" && <PSchedule />}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN SECTION
// ══════════════════════════════════════════════════════════════════════════════

const aNav = [
  { id: "a-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "a-applicants", label: "Data Mahasiswa", icon: Users },
  { id: "a-companies", label: "Perusahaan", icon: Building2 },
  { id: "a-reports", label: "Laporan", icon: BarChart2 },
  { id: "a-users", label: "Manajemen User", icon: Settings },
];

function ASidebar({ page, setPage, collapsed, setCollapsed }: { page: AdminPage; setPage: (p: AdminPage) => void; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  return (
    <aside className={cn("flex flex-col h-screen bg-slate-950 transition-all duration-300 flex-shrink-0", collapsed ? "w-[60px]" : "w-56")}>
      <div className="flex items-center gap-2.5 px-3 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0"><Shield size={16} className="text-white" /></div>
        {!collapsed && <div className="flex-1 min-w-0"><p className="text-white font-extrabold text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p><p className="text-slate-400 text-[11px] mt-0.5">Administrator</p></div>}
        <button onClick={() => setCollapsed(!collapsed)} className={cn("text-slate-500 hover:text-white", collapsed && "mx-auto")}><Menu size={15} /></button>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && <p className="text-slate-600 text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Admin Menu</p>}
        {aNav.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id as AdminPage)}
              className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all", active ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white", collapsed && "justify-center")}
              title={collapsed ? item.label : undefined}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className={cn("p-2 border-t border-white/5", collapsed && "flex justify-center")}>
        {collapsed ? <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">AS</div>
          : <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AS</div>
            <div className="min-w-0"><p className="text-white text-xs font-semibold truncate">Admin Sistem</p><p className="text-slate-400 text-[11px]">Administrator</p></div>
          </div>
        }
      </div>
    </aside>
  );
}

function ADashboard() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-violet-700 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%)", backgroundSize: "8px 8px" }} />
        <div className="relative z-10">
          <p className="text-violet-200 text-xs font-medium mb-1">Panel Administrator</p>
          <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Sistem Manajemen Magang</h2>
          <p className="text-violet-200 text-sm mt-1">Periode Aktif: Semester Genap 2026/2027</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Pendaftar" value="48" sub="↑ 12 dari bulan lalu" icon={<Users size={17} />} color="blue" trend="+33%" />
        <StatCard label="Magang Aktif" value="32" sub="Di 18 perusahaan" icon={<Briefcase size={17} />} color="emerald" />
        <StatCard label="Perlu Verifikasi" value="7" sub="Berkas menunggu" icon={<AlertCircle size={17} />} color="amber" />
        <StatCard label="Selesai Bulan Ini" value="5" sub="Sertifikat diterbitkan" icon={<Award size={17} />} color="violet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Tren Pendaftaran 6 Bulan</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={adminMonthlyData}>
              <defs>
                <linearGradient id="gDaftar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLulus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0" }} />
              <Area type="monotone" dataKey="daftar" stroke="#7C3AED" strokeWidth={2} fill="url(#gDaftar)" name="Pendaftar" />
              <Area type="monotone" dataKey="lulus" stroke="#2563EB" strokeWidth={2} fill="url(#gLulus)" name="Diterima" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Distribusi Status</h3>
          <ResponsiveContainer width="100%" height={140}>
            <RePie>
              <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </RePie>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusPieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className="text-slate-600">{d.name}</span></div>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AApplicants() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("semua");
  const filtered = applicants.filter(a =>
    (filter === "semua" || a.status === filter) &&
    (a.nama.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search))
  );
  const statusColors: Record<string, string> = { aktif: "text-blue-600", selesai: "text-emerald-600", seleksi: "text-amber-600", ditolak: "text-red-500" };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari mahasiswa atau NIM..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all" />
        </div>
        <div className="flex gap-1">
          {["semua", "aktif", "seleksi", "selesai", "ditolak"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all", filter === f ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100")}>
              {f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"><Plus size={13} /> Tambah</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["NIM", "Nama Mahasiswa", "Program Studi", "IPK", "Smt", "Status", "Perusahaan", "Pembimbing", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {a.nama.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-semibold text-slate-900 whitespace-nowrap">{a.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{a.prodi}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{a.ipk}</td>
                  <td className="px-4 py-3 text-slate-500">{a.semester}</td>
                  <td className="px-4 py-3"><Badge status={a.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{a.perusahaan}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{a.pembimbing}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"><Eye size={13} /></button>
                      <button className="w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all"><Edit2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">Tidak ada data yang cocok</div>}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Menampilkan {filtered.length} dari {applicants.length} mahasiswa</span>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => <button key={p} className={cn("w-7 h-7 rounded-lg font-semibold", p === 1 ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100")}>{p}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ACompanies() {
  const companies = [
    { nama: "PT. RAG", kota: "Jakarta Selatan", bidang: "Backend Engineering", kuota: 5, terisi: 3, status: "aktif" },
    { nama: "PT. Gojek Indonesia", kota: "Jakarta Pusat", bidang: "Mobile & Frontend", kuota: 8, terisi: 6, status: "aktif" },
    { nama: "CV. Kreasi Media", kota: "Bandung", bidang: "Desain & Multimedia", kuota: 3, terisi: 2, status: "aktif" },
    { nama: "PT. Bank Digital Nusantara", kota: "Surabaya", bidang: "Data Science & Analytics", kuota: 4, terisi: 4, status: "penuh" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors"><Plus size={14} /> Tambah Perusahaan</button>
      </div>
      {companies.map((c, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{c.nama}</p>
                <p className="text-sm text-slate-500">{c.bidang}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} />{c.kota}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge status={c.status} />
              <p className="text-sm font-bold text-slate-900">{c.terisi}/{c.kuota} <span className="text-xs font-normal text-slate-400">kuota</span></p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", c.status === "penuh" ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${(c.terisi / c.kuota) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AReports() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Mahasiswa" value="48" sub="Semester ini" icon={<Users size={17} />} color="blue" />
        <StatCard label="Rata-rata Nilai" value="85.2" sub="Semua mahasiswa aktif" icon={<Star size={17} />} color="amber" />
        <StatCard label="Tingkat Kelulusan" value="94%" sub="2 semester terakhir" icon={<Award size={17} />} color="emerald" />
        <StatCard label="Perusahaan Mitra" value="18" sub="4 provinsi" icon={<Building2 size={17} />} color="violet" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Laporan & Ekspor Data</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { l: "Rekap Nilai Semester", icon: <FileText size={16} />, f: "PDF" },
            { l: "Daftar Mahasiswa Aktif", icon: <Users size={16} />, f: "XLSX" },
            { l: "Statistik Perusahaan", icon: <Building2 size={16} />, f: "PDF" },
            { l: "Laporan Evaluasi", icon: <Star size={16} />, f: "PDF" },
            { l: "Sertifikat Batch", icon: <Award size={16} />, f: "ZIP" },
            { l: "Data Lengkap", icon: <BarChart2 size={16} />, f: "XLSX" },
          ].map(r => (
            <button key={r.l} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-all group">
              <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-violet-700">
                {r.icon}
                <span className="text-xs font-semibold">{r.l}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{r.f}</span>
                <Download size={13} className="text-slate-400 group-hover:text-violet-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AUsers() {
  const users = [
    { nama: "Dr. Hendra Kusuma", email: "hendra.k@uti.ac.id", role: "pembimbing", status: "aktif", mahasiswa: 3 },
    { nama: "Prof. Ahmad Wijaya", email: "ahmad.w@uti.ac.id", role: "pembimbing", status: "aktif", mahasiswa: 5 },
    { nama: "Dr. Rina Susanti", email: "rina.s@uti.ac.id", role: "pembimbing", status: "aktif", mahasiswa: 2 },
    { nama: "Operator 1", email: "op1@sims.ac.id", role: "admin", status: "aktif", mahasiswa: 0 },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors"><Plus size={14} /> Tambah User</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Manajemen User</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {users.map((u, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0", u.role === "admin" ? "bg-violet-500" : "bg-emerald-500")}>
                {u.nama.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{u.nama}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <div className="hidden sm:block">
                <span className={cn("text-xs font-bold px-2 py-1 rounded-lg capitalize", u.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700")}>{u.role}</span>
              </div>
              {u.role === "pembimbing" && <span className="text-xs text-slate-500 hidden md:block">{u.mahasiswa} mahasiswa</span>}
              <Badge status={u.status} />
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"><Edit2 size={13} /></button>
                <button className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<AdminPage>("a-dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const meta: Record<string, { title: string; subtitle: string }> = {
    "a-dashboard": { title: "Dashboard Admin", subtitle: "Ringkasan sistem manajemen magang" },
    "a-applicants": { title: "Data Mahasiswa", subtitle: "Kelola semua mahasiswa peserta magang" },
    "a-companies": { title: "Perusahaan Mitra", subtitle: "Daftar perusahaan & kuota magang" },
    "a-reports": { title: "Laporan & Statistik", subtitle: "Analitik dan ekspor data" },
    "a-users": { title: "Manajemen User", subtitle: "Kelola akun pembimbing dan admin" },
  };
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <ASidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Topbar title={meta[page].title} subtitle={meta[page].subtitle} onLogout={onLogout} role="admin" />
        <main className="flex-1 overflow-y-auto p-5">
          {page === "a-dashboard" && <ADashboard />}
          {page === "a-applicants" && <AApplicants />}
          {page === "a-companies" && <ACompanies />}
          {page === "a-reports" && <AReports />}
          {page === "a-users" && <AUsers />}
        </main>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState<{ page: "login" | "register" | "app"; role: Role }>({ page: "login", role: "mahasiswa" });

  if (auth.page === "login") return <LoginPage onLogin={role => setAuth({ page: "app", role })} onRegister={() => setAuth({ page: "register", role: "mahasiswa" })} />;
  if (auth.page === "register") return <RegisterPage onBack={() => setAuth({ page: "login", role: "mahasiswa" })} />;

  const logout = () => setAuth({ page: "login", role: "mahasiswa" });
  if (auth.role === "pembimbing") return <PembimbingShell onLogout={logout} />;
  if (auth.role === "admin") return <AdminShell onLogout={logout} />;
  return <MahasiswaShell onLogout={logout} />;
}
