const path = require('path');

module.exports = {
	// Trim to avoid trailing whitespace causing "database ... does not exist"
	DATABASE_URL: (process.env.DATABASE_URL || '').trim(),
	DB_FILE: process.env.DB_FILE || path.resolve(__dirname, '..', 'data.sqlite')

};
