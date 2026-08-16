const bcrypt = require("bcryptjs");
const { createRedisClient } = require("../config/redis");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");
const logger = require("../utils/logger");

const redis = createRedisClient();

// ⚠ In-memory store (PostgreSQL/Mongo alternate)
const users = new Map();

const REFRESH_PREFIX = "refresh:";
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

const register = async ({ email, password, role = "user" }) => {
  if (users.has(email))
    throw Object.assign(new Error("User already exists"), { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const userId = `user_${crypto.randomUUID?.() || Date.now()}`;

  users.set(email, { userId, email, hashed, role });
  logger.info("User registered", { userId, role });

  return { userId, email, role };
};

const login = async ({ email, password }) => {
  const user = users.get(email);

  // Same error message whether email is wrong OR password is wrong
  // Prevents user enumeration attacks
  if (!user || !(await bcrypt.compare(password, user.hashed)))
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const payload = { sub: user.userId, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Storing refresh token in Redis means we can revoke it any time
  await redis.setex(
    `${REFRESH_PREFIX}${user.userId}`,
    REFRESH_TTL_SEC,
    refreshToken,
  );

  logger.info("User logged in", { userId: user.userId });
  return { accessToken, refreshToken, expiresIn: "15m" };
};

const refresh = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), {
      status: 401,
    });
  }

  // Confirm token hasn't been revoked
  const stored = await redis.get(`${REFRESH_PREFIX}${decoded.sub}`);
  if (!stored || stored !== token)
    throw Object.assign(new Error("Refresh token revoked"), { status: 401 });

  const user = [...users.values()].find((u) => u.userId === decoded.sub);
  if (!user) throw Object.assign(new Error("User not found"), { status: 401 });

  return {
    accessToken: signAccessToken({
      sub: user.userId,
      email: user.email,
      role: user.role,
    }),
    expiresIn: "15m",
  };
};

const logout = async (userId) => {
  await redis.del(`${REFRESH_PREFIX}${userId}`);
  logger.info("User logged out", { userId });
};

module.exports = { register, login, refresh, logout };
