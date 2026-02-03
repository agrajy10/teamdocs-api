import hasPermission from "../services/hasPermission.js";
import isDocumentOwner from "../services/isDocumentOwner.js";

async function canUpdateDocument(req, res, next) {
  const userId = req.userId;
  const document = req.document;

  if (await isDocumentOwner(document.owner_id, userId)) {
    return next();
  }

  if (await hasPermission(userId, "docs:update")) {
    return next();
  }

  return res.status(403).json({ error: "Permission denied" });
}

export default canUpdateDocument;
