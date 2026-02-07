async function isSuperAdmin(req, res, next) {
  const userId = req.userId;

  try {
    const result = await req.db.oneOrNone(
      `
        SELECT 1
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
          AND r.name = 'admin'
          AND u.is_active = true
          AND u.is_superadmin = true
          AND u.team_id IS NULL
      `,
      [userId],
    );
    if (!result) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default isSuperAdmin;
