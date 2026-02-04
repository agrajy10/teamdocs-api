import db from "../db/index.js";
import sanitize from "sanitize-html";

export async function createDocument(req, res) {
  const title = sanitize(req.body.title);
  const content = sanitize(req.body.content);
  const userId = req.userId;
  const teamId = req.teamId;

  try {
    const document = await db.one(
      `
        INSERT INTO documents (title, content, owner_id, team_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, content, owner_id, created_at, updated_at
        `,
      [title, content, userId, teamId],
    );

    return res.status(201).json({ success: true, document });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}

export async function getAllDocuments(req, res) {
  const teamId = req.teamId;

  try {
    const documents = await db.manyOrNone(
      `
        SELECT id, title, content, created_at, updated_at
        FROM documents
        WHERE team_id = $1
        `,
      [teamId],
    );

    return res.status(200).json({ success: true, documents });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}

export async function getMyDocuments(req, res) {
  const userId = req.userId;
  const teamId = req.teamId;

  try {
    const documents = await db.manyOrNone(
      `
        SELECT id, title, content, owner_id, created_at, updated_at
        FROM documents
        WHERE owner_id = $1
        AND team_id = $2
        `,
      [userId, teamId],
    );

    return res.status(200).json({ success: true, documents });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}

export async function deleteDocument(req, res) {
  const document = req.document;
  const teamId = req.teamId;

  try {
    await db.query(
      `
        DELETE FROM documents
        WHERE id = $1 
        AND team_id = $2
        `,
      [document.id, teamId],
    );

    return res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}

export async function viewDocument(req, res) {
  const document = req.document;
  const teamId = req.teamId;
  try {
    const result = await db.oneOrNone(
      `
        SELECT id, title, content, owner_id, created_at, updated_at
        FROM documents
        WHERE id = $1
        AND team_id = $2
        `,
      [document.id, teamId],
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, document: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}

export async function updateDocument(req, res) {
  const document = req.document;
  const title = sanitize(req.body.title);
  const content = sanitize(req.body.content);

  const teamId = req.teamId;

  try {
    const result = await db.oneOrNone(
      `
        UPDATE documents
        SET title = $1, content = $2, updated_at = NOW()
        WHERE id = $3
        AND team_id = $4
        RETURNING id, title, content, owner_id, created_at, updated_at
        `,
      [title, content, document.id, teamId],
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, document: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}
