import db from "../db/index.js";

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

export default isDocumentOwner;
