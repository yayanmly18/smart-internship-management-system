const log = (type, message, data = null) => {
    console.log(`[${type}] ${message}`, data || "");
};

module.exports = { log };