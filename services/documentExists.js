import db from "../db/index.js";

async function documentExists(documentId) {
  const result = await db.query(
    `
    SELECT id, owner_id
    FROM documents
    WHERE id = $1
    `,
    [documentId],
  );

  return result.length > 0 ? result[0] : null;
}

export default documentExists;
