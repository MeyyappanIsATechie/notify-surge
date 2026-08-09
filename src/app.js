const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { globalLimiter } = require("./middleware/rateLimiter");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const healthRoute = require("./routes/health");
const { ALLOWED_ORIGINS } = require("./config/env");

const app = express();

// ── Security Headers ────────────────────────────────────────────────────────
// Helmet sets ~15 headers automatically:
//   Content-Security-Policy   → restricts where scripts/styles can load from (XSS defense)
//   X-Frame-Options: DENY     → prevents clickjacking
//   X-Content-Type-Options    → stops MIME sniffing attacks
//   Strict-Transport-Security → forces HTTPS
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
// Only whitelisted origins can make cross-origin requests.
// Without this, any website could call your API from a user's browser.
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server calls (no origin) or whitelisted origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body Parser ─────────────────────────────────────────────────────────────
// 10kb limit guards against payload flooding (a simple Layer 7 DoS vector).
app.use(express.json({ limit: "10kb" }));

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/health", healthRoute);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
