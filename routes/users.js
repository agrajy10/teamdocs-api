import { Router } from "express";
import authorize from "../middleware/authorize.js";
import { deleteUser, getAllUsers } from "../services/users.js";
import authenticateSession from "../middleware/authenticateSession.js";
import checkUserInTeam from "../middleware/checkUserInTeam.js";
import handleValidationError from "../middleware/validation.middleware.js";
import csrfValidation from "../middleware/csrf.middleware.js";
import { body } from "express-validator";
import { createMember } from "../services/users.js";
import { PASSWORD_REGEX } from "../constants/constants.js";

const router = Router();

router.get(
  "/",
  authenticateSession,
  authorize("members:view"),
  handleValidationError,
  getAllUsers,
);

router.delete(
  "/:id",
  authenticateSession,
  authorize("members:delete"),
  checkUserInTeam,
  deleteUser,
);

router.post(
  "/create",
  authenticateSession,
  authorize("members:create"),
  [
    body("email").isEmail(),
    body("password")
      .notEmpty()
      .bail()
      .matches(PASSWORD_REGEX)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
      ),
  ],
  handleValidationError,
  csrfValidation,
  createMember,
);

export default router;
