import { Router } from "express";
import { body } from "express-validator";
import handleValidationError from "../middleware/validation.middleware.js";
import register from "../auth/register.js";
import login from "../auth/login.js";
import logout from "../auth/logout.js";

const router = Router();

router.post(
  "/register",
  [
    body("role")
      .notEmpty()
      .isIn(["member", "manager", "admin"])
      .withMessage("Invalid user role"),
    body("email").isEmail(),
    body("password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      )
      .withMessage(
        "Password must be 8+ chars, include uppercase, lowercase, number and special character",
      ),
  ],
  handleValidationError,
  register,
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  handleValidationError,
  login,
);

router.post("/logout", logout);

export default router;
