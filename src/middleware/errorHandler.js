const logger = require("../utils/logger");
const { NODE_ENV } = require("../config/env");

module.exports = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const status = err.status || 500;
  res.status(status).json({
    error: NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
