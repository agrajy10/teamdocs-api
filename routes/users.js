import { Router } from "express";
import authorize from "../middleware/authorize.js";
import { deleteUser, getAllUsers } from "../services/users.js";
import authenticateSession from "../middleware/authenticateSession.js";
import checkUserInTeam from "../middleware/checkUserInTeam.js";

const router = Router();

router.get("/", authenticateSession, authorize("users:read"), getAllUsers);

router.delete(
  "/:id",
  authenticateSession,
  authorize("users:delete"),
  checkUserInTeam,
  deleteUser,
);

export default router;
