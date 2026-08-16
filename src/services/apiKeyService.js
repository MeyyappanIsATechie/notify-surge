const { createRedisClient } = require("../config/redis");
const { generateApiKey, hashApiKey } = require("../utils/tokenUtils");
const logger = require("../utils/logger");

const redis = createRedisClient();
const PREFIX = "apikey:";

// Creates and stores a hashed API key — raw key returned ONCE
const createApiKey = async ({ name, role = "service" }) => {
  const raw = generateApiKey();
  const hash = hashApiKey(raw);

  await redis.set(
    `${PREFIX}${hash}`,
    JSON.stringify({
      name,
      role,
      createdAt: new Date().toISOString(),
    }),
  );

  logger.info("API key created", { name, role });
  return { key: raw, name, role }; // raw shown only here
};

// Validates incoming key by hashing and looking up in Redis
const validateApiKey = async (raw) => {
  const data = await redis.get(`${PREFIX}${hashApiKey(raw)}`);
  return data ? JSON.parse(data) : null;
};

const revokeApiKey = async (raw) => {
  await redis.del(`${PREFIX}${hashApiKey(raw)}`);
  logger.info("API key revoked");
};

module.exports = { createApiKey, validateApiKey, revokeApiKey };
