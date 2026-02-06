async function authenticateSession(req, res, next) {
  const sessionId = req.cookies.session_id;
  if (!sessionId)
    return res.status(401).json({
      message: "Invalid session token",
    });

  const session = await req.db.oneOrNone(
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

  const team = await req.db.oneOrNone(
    `
      SELECT team_id
      FROM users
      WHERE id = $1
      `,
    [session.user_id],
  );

  req.teamId = team.team_id;
  req.userId = session.user_id;
  next();
}

export default authenticateSession;
