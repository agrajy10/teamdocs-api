import { Router } from "express";
import handleValidationError from "../middleware/validation.middleware.js";
import { body } from "express-validator";
import authenticateSession from "../middleware/authenticateSession.js";
import authorize from "../middleware/authorize.js";
import { createDocument } from "../services/documents.js";
import csrfValidation from "../middleware/csrf.middleware.js";

const router = Router();

router.post(
  "/",
  [body("title").notEmpty(), body("content").notEmpty().bail().isString()],
  authenticateSession,
  authorize("docs:write"),
  handleValidationError,
  csrfValidation,
  createDocument,
);

export default router;
