const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
    issuer: "notify-surge",
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
    issuer: "notify-surge",
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Prefixed API key: easy to identify in logs/audits (like GitHub's ghp_ prefix)
const generateApiKey = () => `ns_${crypto.randomBytes(32).toString("hex")}`;

// Store ONLY the hash: if Redis is breached, raw keys aren't exposed
const hashApiKey = (key) =>
  crypto.createHash("sha256").update(key).digest("hex");

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateApiKey,
  hashApiKey,
};
