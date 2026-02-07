async function isTeamAdmin(req, res, next) {
  const userId = req.userId;
  const teamId = req.query.team_id;
  const membershipCheck = await req.db.query(
    "SELECT 1 FROM users WHERE id = $1 AND team_id = $2 LIMIT 1",
    [userId, teamId],
  );
  console.log("membershipCheck", membershipCheck);
  if (!membershipCheck.length) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}

export default isTeamAdmin;
