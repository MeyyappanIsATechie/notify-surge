const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const { subscribeToTopic, unsubscribeFromTopic } = require("../services/fcm");
const {
  enqueueBroadcast,
  notificationQueue,
} = require("../queues/notificationQueue");
const { strictLimiter } = require("../middleware/rateLimiter");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { apiKeyGuard } = require("../middleware/apiKeyGuard");

// ── Reusable validators ──────────────────────────────────────────────────────

// Topics are alphanumeric + _ or - only.
// This blocks injection via topic names (e.g. "../../admin" path traversal).
const topicRule = body("topic")
  .isString()
  .trim()
  .matches(/^[a-zA-Z0-9_-]+$/)
  .withMessage("topic: alphanumeric, underscores, and hyphens only");

// Cap at 500 — FCM's batch limit per call
const tokensRule = body("tokens")
  .isArray({ min: 1, max: 500 })
  .withMessage("tokens: array of 1–500 device token strings");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

// ── POST /notifications/subscribe ────────────────────────────────────────────
router.post(
  "/subscribe",
  authenticate,
  [tokensRule, topicRule],
  validate,
  async (req, res, next) => {
    try {
      const { tokens, topic } = req.body;
      const result = await subscribeToTopic(tokens, topic);
      res.json({
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /notifications/unsubscribe ──────────────────────────────────────────
router.post(
  "/unsubscribe",
    authenticate,
  [tokensRule, topicRule],
  validate,
  async (req, res, next) => {
    try {
      const { tokens, topic } = req.body;
      const result = await unsubscribeFromTopic(tokens, topic);
      res.json({
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /notifications/broadcast ────────────────────────────────────────────
// strictLimiter: 10 calls per 15 min per IP — this is a high-impact endpoint
router.post(
  "/broadcast",
  strictLimiter,
  apiKeyGuard, // API key required for broadcast (Bearer token/X-Api-Key)
  authorize("admin", "service"), // Only admin and service roles can broadcast
  [
    topicRule,
    body("title").isString().trim().notEmpty().isLength({ max: 100 }),
    body("body").isString().trim().notEmpty().isLength({ max: 300 }),
    body("data").optional().isObject(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { topic, title, body: msgBody, data } = req.body;
      const job = await enqueueBroadcast({ topic, title, body: msgBody, data });

      // 202 Accepted — request received, will be processed asynchronously
      res.status(202).json({
        accepted: true,
        jobId: job.id,
        message: "Broadcast queued for delivery",
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /notifications/job/:id ───────────────────────────────────────────────
// Check the status of a previously enqueued broadcast
router.get("/job/:id", async (req, res, next) => {
  try {
    const job = await notificationQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState();
    res.json({
      id: job.id,
      state, // waiting | active | completed | failed | delayed
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason || null,
      attemptsMade: job.attemptsMade,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
