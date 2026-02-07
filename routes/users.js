import { Router } from "express";
import authorize from "../middleware/authorize.js";
import { deleteUser, getAllUsers } from "../services/users.js";
import authenticateSession from "../middleware/authenticateSession.js";
import checkUserInTeam from "../middleware/checkUserInTeam.js";
import { query } from "express-validator";
import handleValidationError from "../middleware/validation.middleware.js";

const router = Router();

router.get(
  "/",
  authenticateSession,
  authorize("members:view"),
  [query("team_id").notEmpty().withMessage("Team ID is required")],
  handleValidationError,
  getAllUsers,
);

router.delete(
  "/:id",
  authenticateSession,
  authorize("users:delete"),
  checkUserInTeam,
  deleteUser,
);

export default router;
