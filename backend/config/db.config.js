const path = require('path');

module.exports = {
	DB_FILE: process.env.DB_FILE || path.resolve(__dirname, '..', 'data.sqlite')
};
