const { Redis } = require("ioredis");
const logger = require("../utils/logger");

const createRedisClient = () => {
  const client = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) =>
    logger.error("Redis error", { error: err.message }),
  );

  return client;
};

module.exports = { createRedisClient };
