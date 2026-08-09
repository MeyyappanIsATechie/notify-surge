const morgan = require("morgan");
const logger = require("../utils/logger");

// Pipe morgan HTTP logs into winston
const stream = { write: (msg) => logger.http(msg.trim()) };

module.exports = morgan("combined", { stream });
