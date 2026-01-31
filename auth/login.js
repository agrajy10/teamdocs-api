import crypto from "crypto";

import comparePassword from "../utils/comparePassword.js";
import db from "../db/index.js";

async function login(req, res) {
  const { email, password } = req.body;
  const { exists: emailExists } = await db.one(
    "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)",
    [email],
  );

  if (!emailExists) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = await db.one(
    "SELECT id, email, password_hash from users WHERE email = $1",
    [email],
  );

  const passwordCheck = await comparePassword(password, user.password_hash);

  if (passwordCheck) {
    const sessionId = crypto.randomUUID();
    const userAgent = req.headers["user-agent"] || null;
    const ip = req.ip || null;
    await db.query(
      `INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip_address) 
      VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 day', $3, $4)`,
      [sessionId, user.id, userAgent, ip],
    );

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.cookie("csrf_token", crypto.randomBytes(32).toString("hex"), {
      httpOnly: false,
      sameSite: "strict",
      secure: true,
    });

    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: "Invalid credentials" });
}

export default login;
