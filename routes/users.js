import { Router } from "express";
import authorize from "../middleware/authorize.js";
import { deleteUser, getAllUsers } from "../services/users.js";
import authenticateSession from "../middleware/authenticateSession.js";

const router = Router();

router.get("/", authenticateSession, authorize("users:read"), getAllUsers);

router.delete(
  "/:id",
  authenticateSession,
  authorize("users:delete"),
  deleteUser,
);

export default router;
