const db = require('../integrations/database.client');

const UserModel = {
  // Fungsi untuk nyari user berdasarkan email (Dipakai pas LOGIN)
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0]; // Balikin 1 data user aja
  },

  // Fungsi untuk nyari user berdasarkan NIM/NIP
  findByNimNip: async (nim_nip) => {
    const query = 'SELECT * FROM users WHERE nim_nip = $1';
    const result = await db.query(query, [nim_nip]);
    return result.rows[0];
  },

  // Fungsi untuk masukin data user baru (Dipakai pas REGISTER)
  create: async (userData) => {
    const { nim_nip, nama, email, password, role, prodi, angkatan, no_hp } = userData;
    const query = `
      INSERT INTO users (nim_nip, nama, email, password, role, prodi, angkatan, no_hp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nim_nip, nama, email, role;
    `;
    const values = [nim_nip, nama, email, password, role, prodi, angkatan, no_hp];
    const result = await db.query(query, values);
    return result.rows[0]; // Balikin data user yang baru terdaftar (tanpa password demi keamanan)
  }
};

module.exports = UserModel;