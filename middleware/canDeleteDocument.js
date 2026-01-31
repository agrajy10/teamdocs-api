import db from "../db/index.js";
import hasPermission from "../services/hasPermission.js";

async function isDocumentOwner(documentId, userId) {
  const result = await db.query(
    `
    SELECT 1
    FROM documents
    WHERE id = $1
      AND owner_id = $2
    `,
    [documentId, userId],
  );

  return result.length > 0;
}

async function canDeleteDocument(req, res, next) {
  const userId = req.userId;
  const documentId = req.params.id;

  if (await isDocumentOwner(documentId, userId)) {
    return next();
  }

  if (await hasPermission(userId, "docs:delete")) {
    return next();
  }

  return res.status(403).json({ error: "Permission denied" });
}

export default canDeleteDocument;
