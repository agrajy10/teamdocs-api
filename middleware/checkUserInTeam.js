async function checkUserInTeam(req, res, next) {
  const userIdToDelete = req.params.id;
  const teamId = req.teamId;

  try {
    const user = await req.db.oneOrNone(
      "SELECT id FROM users WHERE id = $1 AND team_id IS NOT DISTINCT FROM $2",
      [userIdToDelete, teamId],
    );

    if (!user) {
      console.log("xxoxoxoo");
      return res.status(404).json({ error: "User not found" });
    }

    req.targetUser = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default checkUserInTeam;
