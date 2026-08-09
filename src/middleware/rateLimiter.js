const rateLimit = require("express-rate-limit");
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require("../config/env");

// Applied globally — 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true, // Sends RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  message: { status: 429, error: "Too many requests. Please try again later." },
});

// Applied to sensitive routes — 10 requests per 15 min per IP
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 429, error: "Rate limit exceeded on this endpoint." },
});

module.exports = { globalLimiter, strictLimiter };
