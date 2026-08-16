const { verifyAccessToken } = require("../utils/tokenUtils");
const { validateApiKey } = require("../services/apiKeyService");

const apiKeyGuard = async (req, res, next) => {
  const header = req.headers.authorization;
  const rawKey = req.headers["x-api-key"];

  // ── JWT path ────────────────────────────────────────────────────────────
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(header.split(" ")[1]);
      return next();
    } catch (err) {
      return res.status(401).json({
        error:
          err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      });
    }
  }

  // ── API key path ─────────────────────────────────────────────────────────
  if (rawKey) {
    try {
      const keyData = await validateApiKey(rawKey);
      if (!keyData) return res.status(401).json({ error: "Invalid API key" });

      req.user = { role: keyData.role, name: keyData.name, via: "apikey" };
      return next();
    } catch (err) {
      return next(err);
    }
  }

  return res.status(401).json({
    error: "Authentication required: Bearer token or X-Api-Key header",
  });
};

module.exports = { apiKeyGuard };
