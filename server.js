require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/utils/logger");
const { PORT } = require("./src/config/env");
const { initFirebase } = require("./src/config/firebase");
const { startWorker } = require("./src/queues/workers/notificationWorker");

// Boot sequence — fail fast if Firebase or Redis can't connect
initFirebase();
const worker = startWorker();

const server = app.listen(PORT, () => {
  logger.info(
    `notify-surge listening on port ${PORT} [${process.env.NODE_ENV}]`,
  );
});

// Graceful shutdown — important for containerized deployments
process.on("SIGTERM", () => {
  logger.warn("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});
