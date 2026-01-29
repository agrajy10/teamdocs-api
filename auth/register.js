import db from "../db/index.js";
import hashPassword from "../utils/hashPassword.js";

async function register(req, res) {
  const { email, password, role } = req.body;
  const { exists: emailExists } = await db.one(
    "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)",
    [email],
  );

  if (emailExists) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const hashedPassword = await hashPassword(password);
  const { role_id } = await db.oneOrNone(
    "SELECT id as role_id FROM roles WHERE name = $1",
    [role],
  );

  if (!role_id) {
    return res.status(400).json({ error: "Invalid user role" });
  }
  await db.query(
    "INSERT INTO users(email, password_hash, is_active, created_at, updated_at, role_id) VALUES($1, $2, $3, NOW(), NOW(), $4) RETURNING *",
    [email, hashedPassword, true, role_id],
  );

  return res.status(201).json({ success: true });
}

export default register;
