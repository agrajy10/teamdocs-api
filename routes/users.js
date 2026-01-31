import { Router } from "express";
import authorize from "../middleware/authorize.js";
import { getAllUsers } from "../services/users.js";
import authenticateSession from "../middleware/authenticateSession.js";

const router = Router();

router.get("/", authenticateSession, authorize("users:read"), getAllUsers);

export default router;
