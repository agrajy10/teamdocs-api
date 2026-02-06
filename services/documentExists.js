async function documentExists(db, documentId, teamId) {
  const result = await db.query(
    `
    SELECT id, owner_id, team_id
    FROM documents
    WHERE id = $1
    AND team_id = $2
    `,
    [documentId, teamId],
  );

  return result.length > 0 ? result[0] : null;
}

export default documentExists;
