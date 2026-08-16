// Usage: authorize('admin')  or  authorize('admin', 'service')
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });

    if (!roles.includes(req.user.role))
      return res.status(403).json({
        error: `Forbidden — requires role: [${roles.join(", ")}]`,
        yourRole: req.user.role,
      });

    next();
  };

module.exports = { authorize };
