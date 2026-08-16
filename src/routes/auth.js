const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const { register, login, refresh, logout } = require("../services/authService");
const { createApiKey } = require("../services/apiKeyService");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { strictLimiter } = require("../middleware/rateLimiter");

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  next();
};

// POST /auth/register
router.post(
  "/register",
  strictLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role").optional().isIn(["user", "admin"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      res.status(201).json(await register(req.body));
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/login
router.post(
  "/login",
  strictLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      res.json(await login(req.body));
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "refreshToken required" });
    res.json(await refresh(refreshToken));
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", authenticate, async (req, res, next) => {
  try {
    await logout(req.user.sub);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /auth/api-key — admin only
router.post(
  "/api-key",
  authenticate,
  authorize("admin"),
  [body("name").isString().trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const result = await createApiKey({ name: req.body.name });
      res.status(201).json({
        ...result,
        warning: "Store this key securely — it will NOT be shown again.",
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
