import hasPermission from "../services/hasPermission.js";
import isDocumentOwner from "../services/isDocumentOwner.js";

async function canViewDocument(req, res, next) {
  const userId = req.userId;
  const documentId = req.params.id;

  if (await isDocumentOwner(documentId, userId)) {
    return next();
  }

  if (await hasPermission(userId, "docs:read")) {
    return next();
  }

  return res.status(403).json({ error: "Permission denied" });
}

export default canViewDocument;
