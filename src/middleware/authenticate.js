const { verifyAccessToken } = require("../utils/tokenUtils");

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });

  try {
    req.user = verifyAccessToken(header.split(" ")[1]);
    next();
  } catch (err) {
    res.status(401).json({
      error:
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
};

module.exports = { authenticate };
