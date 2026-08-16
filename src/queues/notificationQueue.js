const { Queue } = require("bullmq");
const { createRedisClient } = require("../config/redis");
const logger = require("../utils/logger");

// BullMQ needs its own dedicated Redis connection
const connection = createRedisClient();

const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: "exponential",
      delay: 2000, // 2s → 4s → 8s between retries
    },
    removeOnComplete: 100, // Keep the 100 most recent completed jobs for inspection
    removeOnFail: 200, // Keep 200 failed jobs for debugging
  },
});

// The only way to add a broadcast job — keeps queue interaction centralized
const enqueueBroadcast = async ({ topic, title, body, data = {} }) => {
  const job = await notificationQueue.add("broadcast", {
    topic,
    title,
    body,
    data,
    enqueuedAt: new Date().toISOString(),
  });

  logger.info("Broadcast job enqueued", { jobId: job.id, topic });
  return job;
};

module.exports = { notificationQueue, enqueueBroadcast };
