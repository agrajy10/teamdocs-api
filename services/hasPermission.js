import { getDb } from "../db/index.js";

async function hasPermission(userId, permission, teamId) {
  const result = await getDb().query(
    `
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON u.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1
      AND p.name = $2
      AND u.is_active = true
      AND u.team_id = $3
    `,
    [userId, permission, teamId],
  );

  return result.length > 0;
}

export default hasPermission;
