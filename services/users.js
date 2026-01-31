import db from "../db/index.js";

export async function getAllUsers(_, res) {
  const users = await db.query(
    "SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at, r.name AS role FROM users u LEFT JOIN roles r ON u.role_id = r.id",
  );
  res.status(200).json({ users });
}

export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    await db.query("DELETE FROM users WHERE id = $1", [userId]);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
