import { getDb } from "../db/index.js";

export async function getAllUsers(req, res) {
  const teamId = req.teamId;
  const users = await getDb().query(
    `SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at, r.name AS role FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id WHERE u.team_id = $1`,
    [teamId],
  );
  res.status(200).json({ users });
}

export async function deleteUser(req, res) {
  const teamId = req.teamId;
  try {
    const userId = req.params.id;
    await getDb().query("DELETE FROM users WHERE id = $1 AND team_id = $2", [
      userId,
      teamId,
    ]);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
