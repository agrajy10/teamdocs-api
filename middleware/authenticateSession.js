import db from "../db/index.js";

async function authenticateSession(req, res, next) {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return res.sendStatus(401);

  const session = await db.oneOrNone(
    `
            SELECT user_id
            FROM sessions
            WHERE id = $1
            AND expires_at > NOW()
            `,
    [sessionId],
  );

  if (session === null) {
    return res.status(401).json({
      message: "Invalid session token",
    });
  }

  req.userId = session.user_id;
  next();
}

export default authenticateSession;
