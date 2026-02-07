import hashPassword from "../utils/hashPassword.js";

export async function createTeam(req, res) {
  const { name, admin } = req.body;
  const adminEmail = admin.email;
  const adminPassword = admin.password;

  try {
    const result = await req.db.tx(async (tx) => {
      const { exists: nameExists } = await tx.one(
        "SELECT EXISTS (SELECT 1 FROM teams WHERE name = $1)",
        [name],
      );
      if (nameExists) {
        throw new Error("TEAM_EXISTS");
      }
      const { exists: emailExists } = await tx.one(
        "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)",
        [adminEmail],
      );
      if (emailExists) {
        throw new Error("EMAIL_EXISTS");
      }
      const team = await tx.one(
        "INSERT INTO teams (name) VALUES ($1) RETURNING id, name",
        [name],
      );

      const role = await tx.oneOrNone("SELECT id FROM roles WHERE name = $1", [
        "admin",
      ]);

      if (!role) {
        throw new Error("ROLE_NOT_FOUND");
      }

      const passwordHash = await hashPassword(adminPassword);

      const adminUser = await tx.one(
        `INSERT INTO users (email, password_hash, is_active, created_at, updated_at, role_id, team_id)
         VALUES ($1, $2, true, NOW(), NOW(), $3, $4)
         RETURNING id, email`,
        [adminEmail, passwordHash, role.id, team.id],
      );

      return { team, adminUser };
    });

    return res
      .status(201)
      .json({ success: true, team: result.team, admin: result.adminUser });
  } catch (error) {
    if (error.message === "TEAM_EXISTS") {
      return res.status(400).json({ error: "Team name already exists" });
    }
    if (error.message === "EMAIL_EXISTS") {
      return res.status(400).json({ error: "Admin email already exists" });
    }
    if (error.message === "ROLE_NOT_FOUND") {
      return res.status(500).json({ error: "Admin role not configured" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
