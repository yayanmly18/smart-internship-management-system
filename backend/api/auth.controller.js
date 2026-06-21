const UserModel = require('../models/user.model');
const vflowClient = require('../integrations/vflow.client');
// Catatan: Biasanya pake bcrypt buat hash password, tapi ini versi basic & aman dulu biar konek
// Jika tim lu udah install bcrypt, lu bisa pakai bcrypt.compare dan bcrypt.hash

const AuthController = {
  // 1. FUNGSI REGISTER (Pendaftaran Mahasiswa/User Baru)
  register: async (req, res) => {
    try {
      const { nim_nip, nama, email, password, role, prodi, angkatan, no_hp } = req.body;

      // Validasi input standar
      if (!nim_nip || !nama || !email || !password || !role) {
        return res.status(400).json({ message: 'Data wajib (NIM/NIP, Nama, Email, Password, Role) harus diisi!' });
      }

      // Cek apakah NIM/NIP atau Email udah terdaftar duluan di pgAdmin
      const userExistsByEmail = await UserModel.findByEmail(email);
      const userExistsByNim = await UserModel.findByNimNip(nim_nip);

      if (userExistsByEmail || userExistsByNim) {
        return res.status(400).json({ message: 'NIM/NIP atau Email sudah terdaftar di sistem!' });
      }

      // Simpan user baru ke database PostgreSQL via Model
      const newUser = await UserModel.create({
        nim_nip,
        nama,
        email,
        password, // Di spek produksi, disarankan di-hash pakai bcrypt
        role,
        prodi,
        angkatan,
        no_hp
      });

    if (role === 'mahasiswa') {
        await vflowClient.trigger({
          workflow: 'InternshipSubmitted',
          data: {
            user_id: newUser.id,
            nim_nip: newUser.nim_nip,
            nama: newUser.nama,
            email: newUser.email,
            role: newUser.role
          }
        });
      }

      return res.status(201).json({
        message: 'Registrasi berhasil, Bre!',
        user: newUser
      });

    } catch (error) {
      console.error('❌ Error pas Register:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan pada server backend.' });
    }
  },

  // 2. FUNGSI LOGIN
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password harus diisi!' });
      }

      // Cari usernya di database berdasarkan email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Email tidak terdaftar!' });
      }

      // Cek password cocok atau kaga
      if (user.password !== password) {
        return res.status(401).json({ message: 'Password salah, Bre! Coba inget-inget lagi.' });
      }

      // Struktur data yang dikirim balik disesuaikan dengan kebutuhan App.tsx Frontend lu (userState)
      return res.status(200).json({
        message: 'Login Berhasil! Selamat Datang.',
        user: {
          id: user.id,
          nim_nip: user.nim_nip,
          nama: user.nama,
          email: user.email,
          role: user.role, // 'mahasiswa', 'pembimbing', atau 'admin'
          prodi: user.prodi,
          angkatan: user.angkatan,
          no_hp: user.no_hp
        }
      });

    } catch (error) {
      console.error('❌ Error pas Login:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan pada server backend.' });
    }
  }
};

module.exports = AuthController;