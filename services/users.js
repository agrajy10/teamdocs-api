import hashPassword from "../utils/hashPassword.js";

export async function getAllUsers(req, res) {
  const teamId = req.teamId;
  const userId = req.userId;
  const users = await req.db.query(
    `SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at, r.name AS role FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id WHERE u.team_id = $1 AND u.id <> $2`,
    [teamId, userId],
  );
  res.status(200).json({ users });
}

export async function deleteUser(req, res) {
  const teamId = req.teamId;
  try {
    const userId = req.params.id;
    await req.db.query("DELETE FROM users WHERE id = $1 AND team_id = $2", [
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

export async function createMember(req, res) {
  const teamId = req.teamId;
  const { email, password } = req.body;

  try {
    const exists = await req.db.one(
      "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1) AS exists",
      [email],
    );
    if (exists.exists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const role = await req.db.oneOrNone(
      "SELECT id FROM roles WHERE name = $1",
      ["member"],
    );
    if (!role) {
      return res.status(500).json({ error: "Member role not configured" });
    }

    const passwordHash = await hashPassword(password);

    const user = await req.db.one(
      `INSERT INTO users (email, password_hash, is_active, created_at, updated_at, role_id, team_id)
       VALUES ($1, $2, true, NOW(), NOW(), $3, $4)
       RETURNING id, email`,
      [email, passwordHash, role.id, teamId],
    );

    return res.status(201).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
