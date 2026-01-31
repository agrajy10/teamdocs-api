import db from "../db/index.js";

export async function getAllUsers(_, res) {
  const users = await db.query(
    "SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at, r.name AS role FROM users u LEFT JOIN roles r ON u.role_id = r.id",
  );
  res.status(200).json({ users });
}
