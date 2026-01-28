import { hasPermission } from "../services/hasPermission.js";

function authorize(permission) {
  return async (req, res, next) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(403).json({ error: "Authentication required" });
    }

    const allowed = await hasPermission(req.db, userId, permission);

    if (!allowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
}

export default authorize;
