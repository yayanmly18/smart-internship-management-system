import {
  LogOut, Upload, Download, CheckCircle, Clock, User, Building2,
  GraduationCap, Star, Calendar, Menu, X, Eye, EyeOff, ArrowRight,
  Shield, MessageSquare, Target, ChevronDown, ChevronRight, Search,
  Filter, MoreHorizontal, AlertCircle, Zap, Users, BookOpen,
  Settings, PieChart, BarChart2, Layers, Hash, Mail, Phone,
  MapPin, Edit2, Trash2, Plus, RefreshCw, ExternalLink, Info,
  CheckSquare, XSquare, Send, Paperclip, Flag, TrendingDown, Briefcase,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Award,
  TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend,
} from "recharts";

import React, { useState, useEffect, useRef } from "react";

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

// ─── Mock Data (fallbacks) ────────────────────────────────────────────────────
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

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  title,
  subtitle,
  onLogout,
  role,
  displayName,
  initials,
}: {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  role: Role;
  displayName?: string;
  initials?: string;
}) {
  const roles = { mahasiswa: "Mahasiswa", pembimbing: "Dosen Pembimbing", admin: "Administrator" };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 flex-shrink-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-bold text-slate-900 truncate" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onLogout} className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all" title="Keluar">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}


// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onRegister, login }: { onRegister: () => void; login: (email: string, password: string, role: Role) => Promise<any> }) {
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
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col h-full p-12">
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
          </div>
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><GraduationCap size={18} className="text-white" /></div>
            <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</span>
          </div>
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Masuk ke Akun</h2>
            <p className="text-slate-500 text-sm mt-1">Pilih peran dan login dengan akun anda</p>
          </div>
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
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder={selectedRole === "mahasiswa" ? "nim@mahasiswa.ac.id" : selectedRole === "pembimbing" ? "dosen@kampus.ac.id" : "admin@nextern.ac.id"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Password</label>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Lupa password?</button>
                </div>
                <div className="relative">
                  <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button
                onClick={async () => {
                  try { await login(email, pass, selectedRole); }
                  catch (error) { window.alert((error as Error).message || "Login gagal"); }
                }}
                className={cn(
                  "w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md",
                  selectedRole === "admin" ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200" :
                    selectedRole === "pembimbing" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
                      "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                Masuk <ArrowRight size={16} />
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
function RegisterPage({ onBack, register }: { onBack: () => void; register: (payload: any) => Promise<any> }) {
  const prodiList = ["Teknik Informatika", "Sistem Informasi", "Teknik Komputer", "Ilmu Komputer", "Teknologi Informasi"];
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [prodi, setProdi] = useState("");
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      window.alert("Password dan konfirmasi password tidak cocok.");
      return;
    }
    try {
      await register({ name, nim, email, prodi, year, phone, password, role: "mahasiswa" });
      window.alert("Pendaftaran berhasil. Silakan login.");
      onBack();
    } catch (error) {
      window.alert((error as Error).message || "Pendaftaran gagal.");
    }
  };

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
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Nama sesuai KTP" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">NIM</label>
              <input value={nim} onChange={e => setNim(e.target.value)} type="text" placeholder="22031234" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email Kampus</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="nim@mahasiswa.ac.id" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Program Studi</label>
              <select value={prodi} onChange={e => setProdi(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all">
                <option value="">Pilih Program Studi</option>
                {prodiList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Angkatan</label>
              <input value={year} onChange={e => setYear(e.target.value)} type="text" placeholder="2022" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">No. HP</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="text" placeholder="+62 812-xxxx-xxxx" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min. 8 karakter" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Konfirmasi Password</label>
              <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Ulangi password" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2">
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
      <div className="flex items-center justify-center h-16 border-b border-white/5 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Mahasiswa</p>
            </div>
            <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white transition-colors">
              <Menu size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white transition-colors">
            <Menu size={15} />
          </button>
        )}
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
    </aside>
  );
}

// Mahasiswa — Dashboard
function MDashboard({ setPage, currentUser }: { setPage: (p: MahasiswaPage) => void; currentUser: any }) {
  const name = currentUser?.name || "Mahasiswa";
  const prodi = currentUser?.prodi || "Program Studi";
  const year = currentUser?.year ? `Angkatan ${currentUser.year}` : "Angkatan 2026";
  const nim = currentUser?.nim || "NIM belum diisi";

  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/dashboard/mahasiswa/dashboard', { headers });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setDashData(json.data);
      } catch (e) {
        setDashData(null);
      }
    };
    fetchData();
  }, []);

  const stats = dashData?.stats || { progress: 0, laporanDikirim: '0/8', avgScore: '-', remainingDays: '-' };
  const weekly = dashData?.weeklyData || weeklyData;
  const tl = dashData?.timeline || [];
  const companyName = dashData?.internship?.company || '-';
  const status = dashData?.internship?.status || 'pending';

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-1">Hola, selamat datang</p>
            <h2 className="text-xl font-extrabold mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{name}</h2>
            <p className="text-blue-200 text-sm">{prodi} · {year} · {nim}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Magang {status === 'selesai' ? 'Selesai' : 'Aktif'}
              </span>
              {companyName && companyName !== '-' && (
                <span className="bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-blue-100">{companyName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Progress Magang" value={`${stats.progress}%`} sub={`${stats.laporanDikirim} minggu`} icon={<TrendingUp size={17} />} color="blue" trend="+" />
        <StatCard label="Laporan Dikirim" value={stats.laporanDikirim} sub="Laporan mingguan" icon={<FileText size={17} />} color="emerald" />
        <StatCard label="Nilai Sementara" value={String(stats.avgScore)} sub="Rata-rata feedback" icon={<Star size={17} />} color="amber" />
        <StatCard label="Status" value={status === 'selesai' ? 'Selesai' : status === 'aktif' ? 'Aktif' : 'Proses'} sub="Magang" icon={<Calendar size={17} />} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Progres & Laporan</h3>
            <Badge status={status} />
          </div>
          <div className="flex items-center gap-5 mb-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#EFF6FF" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#2563EB" strokeWidth="4"
                  strokeDasharray={`${Math.min(stats.progress, 100) * 0.88} 40`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-sm font-extrabold text-slate-900">{stats.progress}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {[
                { label: "Kehadiran", val: 95, color: "bg-emerald-500" },
                { label: "Laporan Mingguan", val: Math.min(stats.progress, 100), color: "bg-blue-500" },
                { label: "Penilaian", val: stats.avgScore !== '-' ? Math.min(Number(stats.avgScore), 100) : 0, color: "bg-violet-500" },
              ].map((item: any) => (
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
              <BarChart data={weekly} barGap={3} barSize={12}>
                <CartesianGrid vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0", padding: "6px 10px" }} />
                <Bar dataKey="laporan" fill="#2563EB" radius={[4, 4, 0, 0]} name="Laporan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Aktivitas Terbaru</h3>
          </div>
          <div className="space-y-0">
            {tl.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas</div>}
            {tl.map((item: any, i: number) => {
              const colors: Record<string, string> = { upload: "bg-blue-500", feedback: "bg-violet-500", placement: "bg-emerald-500", approval: "bg-emerald-500", selection: "bg-amber-500" };
              return (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", colors[item.type] ?? "bg-slate-300")} />
                    {i < tl.length - 1 && <div className="w-px bg-slate-100 flex-1 mt-1" />}
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
function MRegistration({ setPage, submitInternship, currentUser }: { setPage: (p: MahasiswaPage) => void; submitInternship: (payload: any) => Promise<any>; currentUser: any }) {
  const [registrationLocked, setRegistrationLocked] = useState(false);
  const [registrationReason, setRegistrationReason] = useState<string | null>(null);

  const [step, setStep] = useState(1);


  useEffect(() => {
    const internship = currentUser?.internship;
    if (!internship) return;

    const status = String(internship.status || '').toLowerCase();
    const reasonMap: Record<string, string> = {
      'aktif': 'Anda sudah diterima magang dan sedang aktif, tidak dapat mendaftar lagi.',
      'diterima': 'Anda sudah diterima magang, tidak dapat mendaftar lagi.',
      'selesai': 'Anda sudah menyelesaikan program magang, tidak dapat mendaftar lagi.',
      'seleksi': 'Pendaftaran Anda sedang dalam proses seleksi, tidak dapat mendaftar ulang.',
      'pending': 'Pendaftaran Anda masih menunggu review, tidak dapat mendaftar ulang.',
      'ditolak': 'Pendaftaran Anda sebelumnya ditolak. Silakan hubungi admin untuk informasi lebih lanjut.',
    };

    if (reasonMap[status]) {
      setRegistrationLocked(true);
      setRegistrationReason(reasonMap[status]);
    }
  }, [currentUser]);


  // Step 1 state
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alamat, setAlamat] = useState("");

  // Step 2 state
  const [prodi, setProdi] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [ipk, setIpk] = useState("");
  const [sks, setSks] = useState("");
  const [motivasi, setMotivasi] = useState("");

  // Step 3 state
  const [skills, setSkills] = useState<string[]>([]);
  const [ns, setNs] = useState("");
  const [certificates, setCertificates] = useState("");

  // Step 4 state
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    krs: null,
    transcript: null,
    internship_letter: null,
    cv: null,
    portfolio: null,
  });
  const steps = ["Data Diri", "Akademik", "Keahlian", "Dokumen"];
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from currentUser if available
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setNama(currentUser.name);
      if (currentUser.nim) setNim(currentUser.nim);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  const handleDocumentUpload = (docType: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [docType]: file }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (step < 4) { setStep(Math.min(4, step + 1)); return; }

    // Validate required documents
    const requiredDocs = ['krs', 'transcript', 'internship_letter', 'cv'];
    const missingDocs = requiredDocs.filter(docType => !documents[docType]);
    if (missingDocs.length > 0) {
      alert(`Dokumen wajib belum diupload: ${missingDocs.join(', ')}`);
      return;
    }

    // Use user's authenticated email, not form input
    const userEmail = currentUser?.email || email;

    // Build FormData to send fields + files
    const fd = new FormData();
    fd.append('name', nama);
    fd.append('nim', nim);
    fd.append('email', userEmail);
    fd.append('phone', phone);
    fd.append('alamat', alamat);
    fd.append('prodi', prodi);
    fd.append('year', year);
    fd.append('semester', semester);
    fd.append('ipk', ipk);
    fd.append('sks', sks);
    fd.append('motivation', motivasi);
    fd.append('skills', skills.join(','));
    fd.append('certificates', certificates);

    // Append files
    Object.entries(documents).forEach(([key, file]) => {
      if (file) fd.append('documents', file, `${key}_${file.name}`);
    });

    setSubmitting(true);
    try {
      await submitInternship(fd);
      alert('Pendaftaran berhasil');
      setPage('dashboard');
    }
    catch (err: any) { alert(err?.message || 'Gagal'); }
    finally { setSubmitting(false); }
  };

  if (registrationLocked) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Pendaftaran ditutup</h3>
              <p className="text-sm text-emerald-100 mt-1">{registrationReason ?? "Anda sudah diterima."}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-sm text-slate-600">
            Silakan cek <span className="font-bold text-slate-900">Status Magang</span> untuk perkembangan proses.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setPage('status')}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
            >
              Lihat Status
            </button>
            <button
              type="button"
              onClick={() => setPage('dashboard')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => step > i + 1 && setStep(i + 1)}>
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                  step === i + 1 ? "bg-blue-600 text-white ring-4 ring-blue-100" : step > i + 1 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
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
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
                <input value={nama} onChange={e => setNama(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">NIM</label>
                <input value={nim} onChange={e => setNim(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email Kampus</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">No. HP</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Alamat</label>
                <input value={alamat} onChange={e => setAlamat(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Informasi Akademik</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Program Studi</label>
                <input value={prodi} onChange={e => setProdi(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Semester</label>
                <input value={semester} onChange={e => setSemester(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Angkatan</label>
                <input value={year} onChange={e => setYear(e.target.value)} type="text" placeholder="2024" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">IPK</label>
                <input value={ipk} onChange={e => setIpk(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">SKS Tempuh</label>
                <input value={sks} onChange={e => setSks(e.target.value)} type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Motivasi Magang</label>
                <textarea value={motivasi} onChange={e => setMotivasi(e.target.value)} rows={3} placeholder="Jelaskan motivasi Anda..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all resize-none" />
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Keahlian & Sertifikat</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Keahlian (Skills)</label>
              <div className="flex flex-wrap gap-2 mb-2.5">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
                    {s} <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="text-blue-400 hover:text-blue-700"><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={ns} onChange={e => setNs(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && ns.trim()) { e.preventDefault(); setSkills([...skills, ns.trim()]); setNs(""); } }}
                  placeholder="Contoh: React.js, Python, UI/UX..." className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
                <button type="button" onClick={() => { if (ns.trim()) { setSkills([...skills, ns.trim()]); setNs(""); } }} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Tambah</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Sertifikat (Opsional)</label>
              <input value={certificates} onChange={e => setCertificates(e.target.value)} placeholder="Contoh: TOEFL, IELTS, AWS Certified, dll (pisahkan dengan koma)" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all" />
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Upload Dokumen</h3>
            <p className="text-xs text-slate-500">Upload dokumen wajib (KRS, Transkrip, Surat Pengantar, CV) dan opsional (Portfolio)</p>
            <div className="space-y-2">
              {[
                { key: 'krs', l: 'Kartu Rencana Studi (KRS)', required: true, format: 'PDF/JPG/PNG', maxSize: '5MB' },
                { key: 'transcript', l: 'Transkrip Nilai', required: true, format: 'PDF/JPG/PNG', maxSize: '5MB' },
                { key: 'internship_letter', l: 'Surat Pengantar Magang', required: true, format: 'PDF/JPG/PNG', maxSize: '3MB' },
                { key: 'cv', l: 'Curriculum Vitae (CV)', required: true, format: 'PDF/DOCX/JPG/PNG', maxSize: '3MB' },
                { key: 'portfolio', l: 'Portofolio (Opsional)', required: false, format: 'PDF/DOCX/ZIP', maxSize: '10MB' },
              ].map(d => (
                <div key={d.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <FileText size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{d.l}</p>
                      <p className="text-[11px] text-slate-400">{d.format} · Max {d.maxSize} {d.required && <span className="text-red-500">*</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`doc-${d.key}`}
                      accept={d.format.replace('/', ',').replace('JPG', 'jpg').replace('PNG', 'png').replace('PDF', 'pdf').replace('DOCX', 'docx').replace('ZIP', 'zip')}
                      onChange={(e) => handleDocumentUpload(d.key, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`doc-${d.key}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={12} />
                      {documents[d.key] ? 'Ganti' : 'Upload'}
                    </label>
                    {documents[d.key] && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle size={12} />
                        {documents[d.key]!.name.slice(0, 20)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
            className={cn("px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50", step === 1 && "opacity-30 cursor-not-allowed")}>Kembali</button>
          <div className="flex items-center gap-1">
            {steps.map((_, i) => <div key={i} className={cn("h-1.5 rounded-full transition-all", step === i + 1 ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200")} />)}
          </div>
          <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
            {submitting ? 'Mengirim...' : (step === 4 ? "Kirim Pendaftaran" : "Lanjut")} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}

// Mahasiswa — Status
function MStatus() {
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/dashboard/mahasiswa/status', { headers });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setStatusData(json.data);
      } catch (e) { setStatusData(null); }
    };
    fetchData();
  }, []);

  const stages = statusData?.stages || [];
  const placement = statusData?.placement || { company: '-', pembimbing: '-', pembimbingEmail: '-' };
  const stats = statusData?.stats || { stagesDone: '0/6', progress: 0 };
  const internship = statusData?.internship || null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Status Magang</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pantau perkembangan proses magang Anda</p>
          </div>
          <Badge status={internship?.status || 'pending'} />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[{ l: "Tahap Selesai", v: stats.stagesDone, c: "text-slate-900" }, { l: "Progres", v: `${stats.progress}%`, c: "text-blue-700" }, { l: "Status", v: internship?.status || '-', c: "text-slate-900" }].map(s => (
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
            <p className="font-bold text-slate-900">{placement.company || '-'}</p>
            <p className="text-sm text-slate-500">{placement.pembimbing || '-'}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Mail size={11} /> {placement.pembimbingEmail || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Alur Proses Magang</h3>
        {stages.length === 0 && <div className="text-sm text-slate-400 text-center py-4">Belum ada data</div>}
        {stages.map((s: any, i: number) => (
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

// Mahasiswa — Monitoring with real file upload
function MMonitoring({ currentUser }: { currentUser: any }) {
  const [week, setWeek] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(8);
  const [uploadedWeeks, setUploadedWeeks] = useState<number[]>([]);

  // Fetch existing reports
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/dashboard/mahasiswa/reports', { headers });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.success && json.data) {
        setReports(json.data.reports || []);
        setProgress(json.data.progress || 0);
        setStatus(json.data.status || '');
        setTotalWeeks(json.data.totalWeeks || 8);
        setUploadedWeeks((json.data.reports || []).map((r: any) => r.week));
      }
    } catch (e) {
      console.error('Failed to fetch reports', e);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // Auto-select next available week
  useEffect(() => {
    if (reports.length > 0) {
      const uploaded = reports.map(r => r.week);
      for (let w = 1; w <= totalWeeks; w++) {
        if (!uploaded.includes(w)) {
          setWeek(w);
          break;
        }
      }
    }
  }, [reports, totalWeeks]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) { alert('Pilih file laporan terlebih dahulu'); return; }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const fd = new FormData();
      fd.append('week', String(week));
      fd.append('note', note);
      fd.append('report_file', file);

      const res = await fetch('/api/dashboard/mahasiswa/upload-report', {
        method: 'POST',
        headers,
        body: fd,
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Gagal upload'); }
      const json = await res.json();

      if (json.success) {
        alert(`Laporan minggu ${week} berhasil diupload!`);
        setFile(null);
        setNote('');
        fetchReports(); // Refresh list
      } else {
        alert(json.message || 'Gagal upload');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal upload laporan');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress overview */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Monitoring Laporan</h3>
            <p className="text-blue-200 text-sm">Upload laporan mingguan Anda</p>
          </div>
          <span className="text-3xl font-black">{progress}%</span>
        </div>
        <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-blue-200">
          <span>{reports.length} laporan terkirim</span>
          <span>Target: {totalWeeks} minggu</span>
        </div>
      </div>

      {/* Week grid */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="font-bold text-slate-900 text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Progress Mingguan</h4>
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
            const done = uploadedWeeks.includes(w);
            const isSelected = week === w;
            return (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={cn(
                  "py-3 rounded-xl text-center text-xs font-bold transition-all",
                  done ? "bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer hover:bg-emerald-200" :
                    isSelected ? "bg-blue-600 text-white ring-2 ring-blue-200" :
                      "bg-slate-50 text-slate-500 border border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                )}
                title={done ? `Minggu ${w} - Sudah dikirim (klik untuk lihat)` : `Minggu ${w} - Belum dikirim`}
              >
                {done ? <CheckCircle size={16} className="mx-auto" /> : <span>W{w}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h4 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Upload Laporan Minggu {week}
        </h4>

        <div className="space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">File Laporan</label>
            <div className="flex items-center gap-3">
              <label className={cn(
                "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                file ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-blue-300"
              )}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", file ? "bg-emerald-100" : "bg-slate-100")}>
                  {file ? <CheckCircle size={20} className="text-emerald-600" /> : <Upload size={20} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {file ? file.name : 'Pilih file laporan...'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, JPG, PNG maks. 10MB'}
                  </p>
                </div>
                <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.zip" />
              </label>
              {file && (
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 p-2">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Catatan</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat laporan minggu ini..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <>Mengupload...</>
            ) : (
              <><Send size={14} /> Kirim Laporan Minggu {week}</>
            )}
          </button>
        </div>
      </div>

      {/* History */}
      {reports.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h4 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Riwayat Laporan ({reports.length})
          </h4>
          <div className="space-y-2">
            {reports.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Minggu {r.week}</p>
                    <p className="text-xs text-slate-400">
                      {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      {r.note ? ` · ${r.note.substring(0, 60)}` : ''}
                    </p>
                  </div>
                </div>
                {r.fileName && (
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">{r.fileName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mahasiswa — Evaluation
function MEvaluation() {
  const [evalData, setEvalData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/dashboard/mahasiswa/evaluation', { headers });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setEvalData(json.data);
      } catch (e) { setEvalData(null); }
    };
    fetchData();
  }, []);

  const comps = evalData?.components || [];
  const finalScore = evalData?.finalScore ?? '-';
  const grade = evalData?.grade ?? '-';
  const predikat = evalData?.predikat ?? '-';
  const feedbacks = evalData?.feedbacks || [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-gradient-to-br from-blue-700 to-violet-700 rounded-2xl p-6 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Nilai Akhir Magang</p>
            <p className="text-5xl font-black mt-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{finalScore}</p>
            <p className="text-blue-100 text-sm mt-1">Predikat: <span className="font-bold text-white">{predikat}</span></p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center">
              <p className="text-4xl font-black">{grade}</p>
              <p className="text-blue-200 text-xs">Grade</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Rincian Penilaian</h3>
        {comps.length === 0 && <div className="text-sm text-slate-400 text-center py-4">Belum ada data penilaian</div>}
        <div className="space-y-5">
          {comps.map((c: any) => (
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
        {comps.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Nilai Akhir</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{finalScore}</span>
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center">{grade}</div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback History */}
      {feedbacks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Riwayat Feedback Pembimbing</h3>
          <div className="space-y-3">
            {feedbacks.map((f: any) => (
              <div key={f.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MessageSquare size={14} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {f.week ? `Minggu ${f.week}` : 'Feedback Umum'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                    <Star size={12} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">{f.score}/100</span>
                  </div>
                </div>
                {f.comment && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 pl-10">
                    {f.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mahasiswa — Certificate
function MCertificate() {
  const [certData, setCertData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/dashboard/mahasiswa/certificate', { headers });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setCertData(json.data);
      } catch (e) { setCertData(null); }
    };
    fetchData();
  }, []);

  const isAvailable = certData?.isAvailable ?? false;
  const user = certData?.user || { name: '-', nim: '-', prodi: '-' };
  const internship = certData?.internship || { company: '-', status: 'pending', startDate: '-' };
  const requirements = certData?.requirements || [];
  const progressPct = certData?.progressPct ?? 0;
  const certificateCode = certData?.certificateCode || null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className={cn("bg-white rounded-2xl border p-5 flex items-center gap-4", isAvailable ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100")}>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isAvailable ? "bg-emerald-100" : "bg-amber-50")}>
          {isAvailable ? <Award size={22} className="text-emerald-600" /> : <Clock size={22} className="text-amber-500" />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 text-sm">{isAvailable ? 'Sertifikat Tersedia' : 'Sertifikat Belum Tersedia'}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAvailable ? `Kode: ${certificateCode || '-'}` : 'Sertifikat diterbitkan setelah semua persyaratan terpenuhi.'}
          </p>
        </div>
        <Badge status={isAvailable ? 'selesai' : 'pending'} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Preview Sertifikat</h3>
        </div>
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 h-2" />
          <div className="p-8 text-center">
            <p className="text-3xl font-black text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{user.name}</p>
            <p className="text-sm text-slate-500 mt-1">NIM: {user.nim} · {user.prodi}</p>
            <p className="text-xs text-slate-500 mt-4">Perusahaan: {internship.company}</p>
            {certificateCode && <p className="text-xs text-slate-400 font-mono mt-2">{certificateCode}</p>}
          </div>
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 h-1.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Persyaratan Kelulusan</h3>
        <div className="space-y-2.5">
          {requirements.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {r.ok ? <CheckCircle size={15} className="text-emerald-500" /> : <Clock size={15} className="text-slate-300" />}
                <span className={cn("text-sm", r.ok ? "text-slate-700" : "text-slate-400")}>{r.label}</span>
              </div>
              <span className={cn("text-xs font-semibold", r.ok ? "text-emerald-600" : "text-slate-400")}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", certData?.allMet ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function MahasiswaShell({ onLogout, currentUser, submitInternship, uploadReport }: { onLogout: () => void; currentUser: any; submitInternship: (payload: any) => Promise<any>; uploadReport: (week: number, note: string) => Promise<any> }) {
  const [page, setPage] = useState<MahasiswaPage>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const meta: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Selamat datang" },
    registration: { title: "Pendaftaran Magang", subtitle: "Lengkapi data" },
    status: { title: "Status Magang", subtitle: "Pantau proses" },
    monitoring: { title: "Monitoring", subtitle: "Upload laporan" },
    evaluation: { title: "Evaluasi", subtitle: "Nilai" },
    certificate: { title: "Sertifikat", subtitle: "Unduh sertifikat" },
  };
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <MSidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Topbar title={meta[page].title} subtitle={meta[page].subtitle} onLogout={onLogout} role="mahasiswa" />
        <main className="flex-1 overflow-y-auto p-5">
          {page === "dashboard" && <MDashboard setPage={setPage} currentUser={currentUser} />}
          {page === "registration" && <MRegistration setPage={setPage} submitInternship={submitInternship} currentUser={currentUser} />}
          {page === "status" && <MStatus />}
          {page === "monitoring" && <MMonitoring currentUser={currentUser} />}
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
];

function PSidebar({ page, setPage, collapsed, setCollapsed }: { page: PembimbingPage; setPage: (p: PembimbingPage) => void; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  return (
    <aside className={cn("flex flex-col h-screen bg-slate-900 transition-all duration-300 flex-shrink-0", collapsed ? "w-[60px]" : "w-56")}>
      <div className="flex items-center justify-center h-16 border-b border-white/5 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><BookOpen size={16} className="text-white" /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-extrabold text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p><p className="text-slate-400 text-[11px] mt-0.5">Pembimbing</p></div>
            <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white transition-colors">
              <Menu size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white transition-colors">
            <Menu size={15} />
          </button>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && <p className="text-slate-600 text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Menu</p>}
        {pNav.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id as PembimbingPage)}
              className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all", active ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white", collapsed && "justify-center")}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function PDashboard({ profile, students, stats: pembimbingStats }: { profile: any; students: any[]; stats: any }) {
  const pembimbingName = profile?.name || 'Pembimbing';
  const pembimbingNip = profile?.nip || '-';
  const totalStudents = students?.length ?? 0;
  const activeStudents = (students || []).filter(s => (s.status || '').toLowerCase() === 'aktif').length;

  const pendingReview = pembimbingStats?.pendingReview ?? 0;
  const averageScore = pembimbingStats?.averageScore ?? 0;
  const hasFeedbacks = pendingReview > 0 || averageScore > 0;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <p className="text-emerald-100 text-xs font-medium mb-1">Dashboard Pembimbing</p>
        <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pembimbingName}</h2>
        <p className="text-emerald-100 text-sm mt-1">NIP {pembimbingNip}</p>
        <div className="flex gap-2 mt-3">
          <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold">{activeStudents} Mahasiswa Aktif</span>
        </div>
      </div>
      {/* Grid statistik disembunyikan sesuai permintaan */}
      <div className="hidden" />

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Mahasiswa Bimbingan</h3>
        <div className="space-y-3">
          {(students || []).map((s: any, idx: number) => (
            <div key={`${s.internshipId}-${s.userEmail}-${idx}`} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(s.studentName || '').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{s.studentName || '-'}</p>
                <p className="text-xs text-slate-400">{s.company || '-'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress ?? 0}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{s.progress ?? 0}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge status={s.status || 'pending'} />
              </div>
            </div>
          ))}
          {(students || []).length === 0 && (
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-center text-sm text-slate-500">
              Tidak ada mahasiswa bimbingan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PStudents({ students }: { students: any[] }) {
  return (
    <div className="space-y-4">
      {students.length === 0 && <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-center text-sm text-slate-500">Tidak ada mahasiswa bimbingan.</div>}
      {(students || []).map((s: any, idx: number) => (
        <div key={`${s.internshipId}-${s.studentNim || idx}`} className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(s.studentName || '').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-bold text-slate-900">{s.studentName || '-'}</p>
                <p className="text-sm text-slate-500">NIM {s.studentNim || '-'}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={11} />{s.company || '-'}</p>
              </div>
            </div>
            <Badge status={s.status || 'pending'} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { l: "Progres", v: `${s.progress ?? 0}%` },
              { l: "Laporan", v: s.reportCount !== undefined ? String(s.reportCount) : '-' },
              { l: "Nilai", v: s.avgScore !== undefined && s.avgScore !== null ? String(s.avgScore) : '-' }
            ].map((stat: any) => (
              <div key={stat.l} className="p-3 rounded-xl bg-slate-50 text-center">
                <p className="text-lg font-extrabold text-slate-900">{stat.v}</p>
                <p className="text-[11px] text-slate-400">{stat.l}</p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress ?? 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PFeedback({ sendFeedback }: { sendFeedback: (studentId: string, score: number, comment: string) => Promise<any> }) {
  const [sel, setSel] = useState(0);
  const [score, setScore] = useState(88);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingList, setPendingList] = useState<any[]>([]);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/dashboard/pembimbing/pending-feedback', { headers });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setPendingList(json.data?.pendingFeedback || []);
    } catch (e) {
      setPendingList([]);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  // Filter: show only items that have reports submitted
  const pending = pendingList.filter(p => p.hasReport);

  const handleSendFeedback = async () => {
    const selected = pending[sel];
    if (!selected) { alert('Pilih laporan terlebih dahulu'); return; }
    if (!comment.trim()) { alert('Silakan isi komentar'); return; }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/dashboard/pembimbing/send-feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId: selected.studentId || selected.id,
          internshipId: selected.internshipId,
          week: selected.week,
          score,
          comment,
        }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Gagal'); }
      const json = await res.json();
      if (json.success) {
        alert(`Feedback untuk ${selected.studentName} minggu ${selected.week} berhasil dikirim!`);
        setScore(88);
        setComment('');
        fetchPending(); // Refresh list
      } else {
        alert(json.message || 'Gagal');
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal kirim feedback');
    } finally {
      setSending(false);
    }
  };

  // Group by student name
  const grouped = pending.reduce((acc: any, p: any) => {
    const key = p.studentName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Student reports list */}
      {Object.keys(grouped).length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Belum ada laporan yang perlu direview</p>
          <p className="text-xs text-slate-400 mt-1">Laporan akan muncul setelah mahasiswa menguploadnya</p>
        </div>
      )}

      {Object.entries(grouped).map(([studentName, reports]) => {
        const reportsList = reports as any[];
        return (
          <div key={studentName} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                {studentName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{studentName}</h3>
                <p className="text-xs text-slate-400">{reportsList.length} laporan</p>
              </div>
            </div>

            <div className="space-y-2">
              {reportsList.map((p: any, i: number) => {
                const isSelected = sel === pending.indexOf(p);
                return (
                  <button
                    key={p.internshipId + '-' + p.week + '-' + i}
                    onClick={() => setSel(pending.indexOf(p))}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all",
                      isSelected ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200" :
                        p.hasFeedback ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white hover:border-emerald-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          p.hasFeedback ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          Minggu {p.week}
                        </span>
                        {p.fileName && (
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">
                            {p.fileName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{p.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{p.excerpt}</p>
                    {p.hasFeedback && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                        <CheckCircle size={12} />
                        <span>Sudah dinilai: {p.existingScore}/100</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Feedback form */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Beri Feedback
              {pending[sel] && (
                <span className="text-slate-400 font-normal"> · {pending[sel].studentName} minggu {pending[sel].week}</span>
              )}
            </h3>
            {pending[sel]?.hasFeedback && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle size={12} /> Revisi
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Nilai (0–100)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={score} onChange={e => setScore(Number(e.target.value))} className="flex-1 accent-emerald-600" />
                <span className="text-lg font-extrabold text-slate-900 w-10 text-right">{score}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Komentar</label>
              <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 transition-all resize-none" />
            </div>
            <button onClick={handleSendFeedback} disabled={sending || !pending[sel]}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
              <Send size={14} /> {sending ? 'Mengirim...' : `Kirim Feedback ${pending[sel] ? `Minggu ${pending[sel].week}` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PSchedule() {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/dashboard/pembimbing/schedule', { headers });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setSchedules(json.data?.schedules || []);
      } catch (e) {
        setSchedules([]);
      }
    };
    fetchSchedule();
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-3">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Jadwal Evaluasi</h3>
        <div className="space-y-3">
          {schedules.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Belum ada jadwal</div>}
          {schedules.map((s: any, i: number) => (
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
      </div>
    </div>
  );
}

function PembimbingShell({ onLogout, currentUser, sendFeedback }: { onLogout: () => void; currentUser: any; sendFeedback: (studentId: string, score: number, comment: string) => Promise<any> }) {
  const [page, setPage] = useState<PembimbingPage>("p-dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [pembimbingStats, setPembimbingStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPembimbingProfile = async () => {
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/internship/pembimbing/profile', { headers });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    setProfile(json.data || null);
  };

  const fetchPembimbingStudents = async () => {
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/internship/pembimbing/students', { headers });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Pembimbing students API error:', res.status, errText);
      throw new Error(errText);
    }
    const json = await res.json();
    setStudents(json.data?.students || []);
  };

  const fetchPembimbingStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/dashboard/pembimbing/stats', { headers });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.success) setPembimbingStats(json.data);
    } catch (e) {
      console.error('Failed to fetch pembimbing stats', e);
      setPembimbingStats(null);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await fetchPembimbingProfile();
        await fetchPembimbingStudents();
        await fetchPembimbingStats();
      }
      catch (e) { setProfile(null); setStudents([]); setPembimbingStats(null); }
      finally { setLoading(false); }
    };
    run();
  }, []);

  const meta: Record<string, { title: string; subtitle: string }> = {
    "p-dashboard": { title: "Dashboard", subtitle: "Ringkasan" },
    "p-students": { title: "Mahasiswa Saya", subtitle: "Detail progres" },
    "p-feedback": { title: "Beri Feedback", subtitle: "Review laporan" },
    "p-schedule": { title: "Jadwal", subtitle: "Kelola jadwal" },
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <PSidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Topbar title={meta[page].title} subtitle={meta[page].subtitle} onLogout={onLogout} role="pembimbing" />
        <main className="flex-1 overflow-y-auto p-5">
          {page === "p-dashboard" && <PDashboard profile={profile} students={students} stats={pembimbingStats} />}
          {page === "p-students" && (loading ? <div className="text-slate-500 text-sm">Loading...</div> : <PStudents students={students} />)}
          {page === "p-feedback" && <PFeedback sendFeedback={sendFeedback} />}
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
      <div className="flex items-center justify-center h-16 border-b border-white/5 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0"><Shield size={16} className="text-white" /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-extrabold text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Nextern</p><p className="text-slate-400 text-[11px] mt-0.5">Admin</p></div>
            <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white transition-colors">
              <Menu size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white transition-colors">
            <Menu size={15} />
          </button>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && <p className="text-slate-600 text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Admin Menu</p>}
        {aNav.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id as AdminPage)}
              className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all", active ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white", collapsed && "justify-center")}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ADashboard() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/dashboard/admin/stats', { headers });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json.data);
      } catch (err) { setData(null); }
    };
    fetchDash();
  }, []);

  // Transform backend data format to frontend format
  const monthly = data?.trenPendaftaran?.length ? data.trenPendaftaran.map((item: any) => ({
    bulan: item.month,
    daftar: parseInt(item.count) || 0,
    lulus: 0
  })) : adminMonthlyData;

  const status = data?.distribusiStatus ? [
    { name: 'Aktif', value: data.distribusiStatus.aktif || 0, color: '#2563EB' },
    { name: 'Selesai', value: data.distribusiStatus.selesai || 0, color: '#10B981' },
    { name: 'Seleksi', value: data.distribusiStatus.seleksi || 0, color: '#F59E0B' },
    { name: 'Ditolak', value: data.distribusiStatus.ditolak || 0, color: '#EF4444' },
  ] : statusPieData;

  const totalPendaftar = parseInt(data?.stats?.totalPendaftar) || 0;
  const totalUsers = parseInt(data?.stats?.totalUser) || 0;
  const totalAdmin = parseInt(data?.stats?.totalAdmin) || 0;
  const totalPembimbing = parseInt(data?.stats?.totalPembimbing) || 0;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-violet-700 to-slate-900 rounded-2xl p-6 text-white">
        <p className="text-violet-200 text-xs font-medium mb-1">Panel Administrator</p>
        <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Sistem Manajemen Magang</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Pendaftar" value={String(totalPendaftar)} sub="Mahasiswa" icon={<Users size={17} />} color="blue" />
        <StatCard label="Total User" value={String(totalUsers)} sub="Semua akun" icon={<Briefcase size={17} />} color="emerald" />
        <StatCard label="Admin" value={String(totalAdmin)} sub="Administrator" icon={<Shield size={17} />} color="violet" />
        <StatCard label="Pembimbing" value={String(totalPembimbing)} sub="Dosen" icon={<BookOpen size={17} />} color="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Tren Pendaftaran</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gDaftar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0" }} />
              <Area type="monotone" dataKey="daftar" stroke="#7C3AED" strokeWidth={2} fill="url(#gDaftar)" name="Pendaftar" />
              <Area type="monotone" dataKey="lulus" stroke="#2563EB" strokeWidth={2} fill="url(#gDaftar)" name="Diterima" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Distribusi Status</h3>
          <ResponsiveContainer width="100%" height={140}>
            <RePie>
              <Pie data={status} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {status.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </RePie>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {status.map((d: any) => (
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
  const [items, setItems] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [pembimbings, setPembimbings] = useState<any[]>([]);
  const [actionStatus, setActionStatus] = useState("");
  const [actionCompany, setActionCompany] = useState("");
  const [actionPembimbing, setActionPembimbing] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchApplicants = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/auth/applicants', { headers });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setItems(json.data || []);
    } catch (e) { setItems([]); }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/perusahaan/companies', { headers });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setCompanies(json.data || []);
    } catch (e) { setCompanies([]); }
  };

  const fetchPembimbings = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/auth/pembimbing', { headers });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPembimbings(json.data || []);
    } catch (e) { setPembimbings([]); }
  };

  useEffect(() => { fetchApplicants(); fetchCompanies(); fetchPembimbings(); }, []);

  const handleSaveApplicant = async () => {
    if (!selectedApplicant) return;
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // If no internshipId, create new internship record first
      if (!selectedApplicant.internshipId) {
        const createBody: any = {
          name: selectedApplicant.nama,
          nim: selectedApplicant.id,
          email: selectedApplicant.userEmail,
          prodi: selectedApplicant.prodi,
          year: selectedApplicant.semester,
        };
        if (actionStatus) createBody.status = actionStatus;
        if (actionCompany) createBody.company = actionCompany;
        if (actionPembimbing) createBody.pembimbing_email = actionPembimbing;

        const createRes = await fetch('/api/internship/admin/create', {
          method: 'POST', headers,
          body: JSON.stringify(createBody),
        });
        if (!createRes.ok) throw new Error(await createRes.text());
      } else {
        // Update existing internship
        const body: any = {};
        if (actionStatus) body.status = actionStatus;
        if (actionCompany) body.companyName = actionCompany;
        if (actionPembimbing) body.pembimbingEmail = actionPembimbing;
        const res = await fetch(`/api/auth/applicants/${selectedApplicant.internshipId}`, {
          method: 'PUT', headers, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
      }

      setShowModal(false);
      setSelectedApplicant(null);
      fetchApplicants();
      alert('Data berhasil disimpan');
    } catch (err: any) { alert(err.message || 'Gagal update'); }
  };

  const openApplicantModal = (a: any) => {
    setSelectedApplicant(a);
    setActionStatus(a.status || 'pending');
    setActionCompany(a.perusahaan !== '-' ? a.perusahaan : '');
    setActionPembimbing('');
    setShowModal(true);
  };

  const filtered = items.filter(a => {
    const status = String(a.status ?? '').toLowerCase();
    const normalizedFilter = filter === "semua" ? "semua" : String(filter).toLowerCase();
    const statusOk = normalizedFilter === "semua" ? true : status === normalizedFilter;
    const searchOk = String(a.nama || '').toLowerCase().includes(search.toLowerCase()) || String(a.id || '').includes(search);
    return statusOk && searchOk;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari mahasiswa..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all" />
        </div>
        <div className="flex gap-1">
          {["semua", "aktif", "seleksi", "selesai", "ditolak"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all", filter === f ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100")}>{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["NIM", "Nama", "Prodi", "Status", "Perusahaan", "Pembimbing", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{a.nama}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.prodi}</td>
                  <td className="px-4 py-3"><Badge status={a.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.perusahaan}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.pembimbing}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openApplicantModal(a)} className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 flex items-center gap-1">
                      <Edit2 size={11} /> Kelola
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">Tidak ada data</div>}
        </div>
      </div>

      {/* Modal Kelola Mahasiswa */}
      {showModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Kelola Mahasiswa</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="text-sm text-slate-700 mb-4">
              <p className="font-semibold">{selectedApplicant.nama}</p>
              <p className="text-xs text-slate-400">NIM: {selectedApplicant.id}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={actionStatus} onChange={e => setActionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option value="pending">Pending</option>
                  <option value="seleksi">Seleksi</option>
                  <option value="aktif">Aktif (Terima)</option>
                  <option value="ditolak">Tolak</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Perusahaan</label>
                <select value={actionCompany} onChange={e => setActionCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option value="">-- Pilih Perusahaan --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.bidang || '-'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dosen Pembimbing</label>
                <select value={actionPembimbing} onChange={e => setActionPembimbing(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option value="">-- Pilih Pembimbing --</option>
                  {pembimbings.map(p => (
                    <option key={p.id} value={p.email}>{p.name} {p.nip ? `(NIP: ${p.nip})` : ''}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleSaveApplicant}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 mt-2">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ACompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', city: '', bidang: '', quota: '' });

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/perusahaan/companies', { headers });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setCompanies(json.data || []);
    } catch (e) { setCompanies([]); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleAddCompany = async () => {
    if (!newCompany.name.trim()) { alert('Nama perusahaan wajib diisi'); return; }
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/perusahaan/companies', {
        method: 'POST', headers,
        body: JSON.stringify({ ...newCompany, quota: Number(newCompany.quota) || 0 }),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowAddForm(false);
      setNewCompany({ name: '', city: '', bidang: '', quota: '' });
      fetchCompanies();
    } catch (err: any) { alert(err.message || 'Gagal menambah perusahaan'); }
  };

  const handleDeleteCompany = async (id: number, name: string) => {
    if (!confirm(`Hapus perusahaan "${name}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/perusahaan/companies/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(await res.text());
      fetchCompanies();
    } catch (err: any) { alert(err.message || 'Gagal menghapus perusahaan'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"><Plus size={14} /> Tambah Perusahaan</button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-violet-200 p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Tambah Perusahaan Baru</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Nama Perusahaan *" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <input value={newCompany.city} onChange={e => setNewCompany({ ...newCompany, city: e.target.value })}
              placeholder="Kota" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <input value={newCompany.bidang} onChange={e => setNewCompany({ ...newCompany, bidang: e.target.value })}
              placeholder="Bidang (ex: IT)" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <input value={newCompany.quota} onChange={e => setNewCompany({ ...newCompany, quota: e.target.value })}
              placeholder="Kuota" type="number" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <div className="flex items-end gap-2">
              <button onClick={handleAddCompany} className="px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700">Simpan</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-slate-200 text-sm rounded-lg text-slate-600 hover:bg-slate-50">Batal</button>
            </div>
          </div>
        </div>
      )}

      {companies.map((c: any) => (
        <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-500">{c.bidang || '-'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} />{c.city || '-'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => handleDeleteCompany(c.id, c.name)} className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">Aktif</span>
              <p className="text-sm font-bold text-slate-900">
                {c.filled ?? 0}/{c.quota ?? 0} <span className="text-xs font-normal text-slate-400">slot</span>
              </p>
            </div>
          </div>
        </div>
      ))}
      {companies.length === 0 && !showAddForm && (
        <div className="p-10 text-center text-slate-400 text-sm">Belum ada perusahaan. Klik Tambah Perusahaan.</div>
      )}
    </div>
  );
}

function AReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/reports/stats', { headers });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setStats(json.data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const downloadReport = async (endpoint: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/reports${endpoint}`, { headers });
      if (!res.ok) throw new Error('Gagal mengunduh laporan');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh laporan');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Mahasiswa" value={String(stats?.totalMahasiswa ?? '-')} sub="Semua terdaftar" icon={<Users size={17} />} color="blue" />
        <StatCard label="Mahasiswa Aktif" value={String(stats?.aktifMahasiswa ?? '-')} sub="Sedang magang" icon={<Star size={17} />} color="emerald" />
        <StatCard label="Perusahaan Mitra" value={String(stats?.totalPerusahaan ?? '-')} sub="Mitra" icon={<Building2 size={17} />} color="violet" />
        <StatCard label="Rata-rata Nilai" value={String(stats?.avgScore ?? '-')} sub="Semua feedback" icon={<Award size={17} />} color="amber" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Laporan & Ekspor Data</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { l: "Rekap Nilai Semester", icon: <FileText size={16} />, f: "PDF", endpoint: "/semester-grades", filename: "rekap-nilai-semester.pdf" },
            { l: "Daftar Mahasiswa Aktif", icon: <Users size={16} />, f: "XLSX", endpoint: "/active-students", filename: "daftar-mahasiswa-aktif.xlsx" },
            { l: "Statistik Perusahaan", icon: <Building2 size={16} />, f: "PDF", endpoint: "/company-stats", filename: "statistik-perusahaan.pdf" },
            { l: "Laporan Evaluasi", icon: <Star size={16} />, f: "PDF", endpoint: "/evaluation", filename: "laporan-evaluasi.pdf" },
          ].map((r: any) => (
            <button key={r.l} onClick={() => downloadReport(r.endpoint, r.filename)} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-all group">
              <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-violet-700">
                {r.icon}
                <span className="text-xs font-semibold">{r.l}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{r.f}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: '', nim: '', nip: '', email: '', prodi: '', year: '', phone: '', password: '', role: 'pembimbing' });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/auth/users', { headers });
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Gagal'); }
      const json = await res.json();
      setUsers(json.data || []);
    } catch (err: any) { setError(err.message || 'Gagal'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', nim: '', nip: '', email: '', prodi: '', year: '', phone: '', password: '', role: 'pembimbing' });
    setShowForm(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, nim: u.nim, nip: u.nip, email: u.email, prodi: u.prodi, year: u.year, phone: u.phone, password: '', role: u.role });
    setShowForm(true);
  };

  const submitForm = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (editUser) {
        const res = await fetch(`/api/auth/users/${editUser.id}`, { method: 'PUT', headers, body: JSON.stringify(form) });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch('/api/auth/register', { method: 'POST', headers, body: JSON.stringify(form) });
        if (!res.ok) throw new Error(await res.text());
      }
      setShowForm(false);
      fetchUsers();
    } catch (err: any) { window.alert(err.message || 'Gagal'); }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(await res.text());
      fetchUsers();
    } catch (err: any) { window.alert(err.message || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"><Plus size={14} /> Tambah User</button>
      </div>
      {showForm && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="p-2 border rounded" />
            {form.role === 'mahasiswa' ? (
              <input value={form.nim} onChange={e => setForm({ ...form, nim: e.target.value })} placeholder="NIM" className="p-2 border rounded" />
            ) : (
              <input value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} placeholder="NIP" className="p-2 border rounded" />
            )}
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="p-2 border rounded" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="p-2 border rounded">
              <option value="pembimbing">Pembimbing</option>
              <option value="admin">Admin</option>
              <option value="mahasiswa">Mahasiswa</option>
            </select>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="No. HP" className="p-2 border rounded" />
            <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="p-2 border rounded" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={submitForm} className="px-3 py-2 bg-blue-600 text-white rounded">Simpan</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 border rounded">Batal</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Manajemen User</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {loading && <div className="p-4">Loading...</div>}
          {error && <div className="p-4 text-red-600">{error}</div>}
          {!loading && !error && users.map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0", u.role === "admin" ? "bg-violet-500" : "bg-emerald-500")}>
                {u.name ? u.name.split(" ").map((n: string) => n[0]).slice(0, 2).join('') : (u.email || '').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{u.name || u.nama}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <div className="hidden sm:block">
                <span className={cn("text-xs font-bold px-2 py-1 rounded-lg capitalize", u.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700")}>{u.role}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(u)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center"><Edit2 size={13} /></button>
                <button onClick={() => deleteUser(u.id)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 size={13} /></button>
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
    "a-dashboard": { title: "Dashboard Admin", subtitle: "Ringkasan sistem" },
    "a-applicants": { title: "Data Mahasiswa", subtitle: "Kelola mahasiswa" },
    "a-companies": { title: "Perusahaan Mitra", subtitle: "Daftar perusahaan" },
    "a-reports": { title: "Laporan & Statistik", subtitle: "Analitik" },
    "a-users": { title: "Manajemen User", subtitle: "Kelola akun" },
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
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  });

  const AUTH_URL = "/api/auth";
  const INTERNSHIP_URL = "/api/internship";
  const WORKFLOW_URL = "/api/workflow";
  const VRULE_URL = "/api/vrule";

  const login = async (email: string, password: string, role: Role) => {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) { const errorText = await res.text(); throw new Error(errorText || "Login gagal"); }
    const data = await res.json();
    if (data && data.token) { localStorage.setItem('token', data.token); }
    if (data && data.data) {
      setCurrentUser(data.data);
      localStorage.setItem('currentUser', JSON.stringify(data.data));
      setAuth({ page: "app", role: data.data.role });
    } else { setAuth({ page: "app", role }); }
    return data;
  };

  const register = async (payload: any) => {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!res.ok) { const errorText = await res.text(); throw new Error(errorText || "Register gagal"); }
    return await res.json();
  };

  const submitInternship = async (payload: any) => {
    const token = localStorage.getItem('token');
    // payload is FormData (contains fields + files)
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${INTERNSHIP_URL}/register`, {
      method: "POST",
      headers,
      body: payload, // FormData - don't set Content-Type, browser sets it with boundary
    });
    if (!res.ok) { const errorText = await res.text(); throw new Error(errorText || "Pengajuan gagal"); }
    return await res.json();
  };

  const uploadReport = async (week: number, note: string) => {
    const token = localStorage.getItem('token');
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${WORKFLOW_URL}/upload`, { method: "POST", headers, body: JSON.stringify({ week, note }) });
    return await res.json();
  };

  const sendFeedback = async (studentId: string, score: number, comment: string) => {
    const token = localStorage.getItem('token');
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${VRULE_URL}/feedback`, { method: "POST", headers, body: JSON.stringify({ studentId, score, comment }) });
    return await res.json();
  };

  const logout = () => {
    setAuth({ page: "login", role: "mahasiswa" });
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  if (auth.page === "login") return <LoginPage login={login} onRegister={() => setAuth({ page: "register", role: "mahasiswa" })} />;
  if (auth.page === "register") return <RegisterPage register={register} onBack={() => setAuth({ page: "login", role: "mahasiswa" })} />;
  if (auth.role === "pembimbing") return <PembimbingShell onLogout={logout} currentUser={currentUser} sendFeedback={sendFeedback} />;
  if (auth.role === "admin") return <AdminShell onLogout={logout} />;
  return <MahasiswaShell onLogout={logout} currentUser={currentUser} submitInternship={submitInternship} uploadReport={uploadReport} />;
}