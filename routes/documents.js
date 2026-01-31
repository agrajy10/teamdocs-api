import { Router } from "express";
import handleValidationError from "../middleware/validation.middleware.js";
import { body } from "express-validator";
import authenticateSession from "../middleware/authenticateSession.js";
import authorize from "../middleware/authorize.js";
import {
  createDocument,
  deleteDocument,
  getDocuments,
} from "../services/documents.js";
import csrfValidation from "../middleware/csrf.middleware.js";
import canDeleteDocument from "../middleware/canDeleteDocument.js";

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

router.get("/", authenticateSession, getDocuments);

router.delete("/:id", authenticateSession, canDeleteDocument, deleteDocument);

export default router;
