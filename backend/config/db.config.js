module.exports = {
  DATABASE_URL: (process.env.DATABASE_URL || '').trim(),
  DB_SSL: String(process.env.DB_SSL || '').toLowerCase() === 'true',
  DB_AUTO_INIT_SCHEMA: String(process.env.DB_AUTO_INIT_SCHEMA || 'true').toLowerCase() !== 'false',
};