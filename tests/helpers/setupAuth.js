import crypto from "crypto";
import { getDb } from "../../db/index.js";

async function setupAuth(user) {
  const sessionId = crypto.randomUUID();
  const csrfToken = crypto.randomBytes(32).toString("hex");

  await getDb().query(
    `INSERT INTO sessions (id, user_id, created_at, expires_at) 
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day')`,
    [sessionId, user.id],
  );

  return { sessionId, csrfToken };
}

export default setupAuth;
