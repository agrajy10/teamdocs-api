import db from "../../db/index.js";
import hashPassword from "../../utils/hashPassword.js";

async function seedUser(overrides = {}) {
  const email = overrides.email || "test@example.com";
  const password = overrides.password || "StrongPass1!";
  const role = overrides.role || "member";
  const passwordHash = await hashPassword(password);

  const teamId = overrides.teamId || null;

  const { role_id } = await db.oneOrNone(
    "SELECT id as role_id FROM roles WHERE name = $1",
    [role],
  );

  return db.query(
    `
    INSERT INTO users (email, password_hash, is_active, created_at, updated_at, role_id, team_id)
    VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)
    RETURNING *
    `,
    [email, passwordHash, true, role_id, teamId],
  );
}

export default seedUser;
