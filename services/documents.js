import db from "../db/index.js";
import sanitize from "sanitize-html";

export async function createDocument(req, res) {
  const title = sanitize(req.body.title);
  const content = sanitize(req.body.content);
  const userId = req.userId;

  try {
    const document = await db.one(
      `
        INSERT INTO documents (title, content, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id, title, content, owner_id, created_at, updated_at
        `,
      [title, content, userId],
    );

    return res.status(201).json({ success: true, document });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
}
