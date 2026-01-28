import db from "../db/index.js";

async function hasPermission(userId, permission) {
  const result = await db.query(
    `
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON u.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1
      AND p.name = $2
      AND u.is_active = true
    `,
    [userId, permission],
  );

  return result.rowCount > 0;
}

export default hasPermission;
