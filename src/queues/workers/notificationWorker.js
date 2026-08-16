const { Worker } = require("bullmq");
const { createRedisClient } = require("../../config/redis");
const { sendToTopic } = require("../../services/fcm");
const logger = require("../../utils/logger");

const startWorker = () => {
  const worker = new Worker(
    "notifications",
    async (job) => {
      const { topic, title, body, data } = job.data;

      logger.info(`Processing job ${job.id}`, { type: job.name, topic });

      if (job.name === "broadcast") {
        const messageId = await sendToTopic({ topic, title, body, data });
        return { messageId, processedAt: new Date().toISOString() };
      }

      throw new Error(`Unknown job type: ${job.name}`);
    },
    {
      connection: createRedisClient(),
      concurrency: 5, // Process up to 5 jobs in parallel
    },
  );

  worker.on("completed", (job, result) => {
    logger.info(`Job ${job.id} completed`, result);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed`, {
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  worker.on("stalled", (jobId) => {
    // A job stalls if the worker dies mid-process — BullMQ detects and re-queues it
    logger.warn(`Job ${jobId} stalled — will be retried`);
  });

  logger.info("Notification worker started [concurrency: 5]");
  return worker;
};

module.exports = { startWorker };
