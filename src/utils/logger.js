const winston = require("winston");
const { NODE_ENV } = require("../config/env");

const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "warn" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format:
        NODE_ENV === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            )
          : winston.format.json(),
    }),
  ],
});

module.exports = logger;
