import e from "express";
const app = e();
const port = 3000;
import cookieParser from "cookie-parser";
import { body } from "express-validator";
import handleValidationError from "./middleware/validation.middleware.js";
import db from "./db/index.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import validateSession from "./middleware/auth.middleware.js";
import hashPassword from "./utils/hashPassword.js";
import authRoutes from "./routes/auth.js";

app.use(e.json());
app.use(cookieParser());
app.set("trust proxy", true);

app.use("/auth", authRoutes);

// app.post(
//   "/auth/login",
//   [body("email").isEmail(), body("password").notEmpty()],
//   handleValidationError,
//   async (req, res) => {
//     const { email, password } = req.body;
//     const { exists: emailExists } = await db.one(
//       "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)",
//       [email],
//     );

//     if (!emailExists) {
//       return res
//         .status(401)
//         .json({ errors: [{ error: "Invalid email or password" }] });
//     }

//     const user = await db.one(
//       "SELECT id, email, password from users WHERE email = $1",
//       [email],
//     );

// const passwordCheck = await comparePassword(password, user.password);

// if (passwordCheck) {
//   const sessionId = crypto.randomUUID();
//   await db.query(
//     `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
//     [sessionId, user.id],
//   );

//   res.cookie("session_id", sessionId, {
//     httpOnly: false,
//     secure: true,
//     sameSite: "strict",
//   });

//   return res.status(200).json({ success: true });
// }

//     return res
//       .status(401)
//       .json({ errors: [{ error: "Invalid email or password" }] });
//   },
// );

// app.post("/logout", async (req, res) => {
//   const sessionId = req.cookies.session_id;

//   if (sessionId) {
//     await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
//   }

//   res.clearCookie("session_id");
//   res.status(200).json({ success: true });
// });

app.listen(port, () => {
  console.log(`App is running on port : ${port}`);
});
