import { Router } from "express";
import authorize from "../middleware/authorize.js";
import { deleteUser, getAllUsers } from "../services/users.js";
import authenticateSession from "../middleware/authenticateSession.js";
import checkUserInTeam from "../middleware/checkUserInTeam.js";
import handleValidationError from "../middleware/validation.middleware.js";

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

export default router;
