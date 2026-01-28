import db from "../db/index.js";

async function logout(req, res) {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return res.sendStatus(401);

  if (sessionId) {
    await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  }

  res.clearCookie("session_id");
  res.status(200).json({ success: true });
}

export default logout;
