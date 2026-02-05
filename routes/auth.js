import { Router } from "express";
import { body } from "express-validator";
import handleValidationError from "../middleware/validation.middleware.js";
import login from "../auth/login.js";
import logout from "../auth/logout.js";
import limiter from "../middleware/rateLimiter.js";

const router = Router();

router.post(
  "/login",
  limiter,
  [body("email").isEmail(), body("password").notEmpty()],
  handleValidationError,
  login,
);

router.post("/logout", logout);

export default router;
