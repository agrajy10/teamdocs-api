import hasPermission from "../services/hasPermission.js";
import isDocumentOwner from "../services/isDocumentOwner.js";

async function canViewDocument(req, res, next) {
  const userId = req.userId;
  const document = req.document;
  const teamId = req.teamId;

  if (await isDocumentOwner(document.owner_id, userId, teamId)) {
    return next();
  }

  if (await hasPermission(userId, "docs:read", teamId)) {
    return next();
  }

  return res.status(403).json({ error: "Permission denied" });
}

export default canViewDocument;
