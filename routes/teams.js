import { Router } from "express";
import { body } from "express-validator";
import { PASSWORD_REGEX } from "../constants/constants.js";
import authenticateSession from "../middleware/authenticateSession.js";
import isSuperAdmin from "../middleware/isSuperAdmin.js";
import csrfValidation from "../middleware/csrf.middleware.js";
import handleValidationError from "../middleware/validation.middleware.js";
import { createTeam } from "../services/teams.js";

const router = Router();

router.post(
  "/create",
  authenticateSession,
  isSuperAdmin,
  [
    body("name").notEmpty().bail().isString(),
    body("admin.email").isEmail(),
    body("admin.password")
      .notEmpty()
      .bail()
      .matches(PASSWORD_REGEX)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
      ),
  ],
  handleValidationError,
  csrfValidation,
  createTeam,
);
export default router;
