import { Router } from "express";
import handleValidationError from "../middleware/validation.middleware.js";
import { body } from "express-validator";
import authenticateSession from "../middleware/authenticateSession.js";
import authorize from "../middleware/authorize.js";
import {
  createDocument,
  deleteDocument,
  getMyDocuments,
  updateDocument,
  viewDocument,
} from "../services/documents.js";
import csrfValidation from "../middleware/csrf.middleware.js";
import canDeleteDocument from "../middleware/canDeleteDocument.js";
import canViewDocument from "../middleware/canViewDocument.js";
import canUpdateDocument from "../middleware/canUpdateDocument.js";

const router = Router();

router.post(
  "/",
  [body("title").notEmpty(), body("content").notEmpty().bail().isString()],
  authenticateSession,
  authorize("docs:create"),
  handleValidationError,
  csrfValidation,
  createDocument,
);

router.get("/my-documents", authenticateSession, getMyDocuments);

router.get("/:id", authenticateSession, canViewDocument, viewDocument);

router.put(
  "/:id",
  [body("title").notEmpty(), body("content").notEmpty().bail().isString()],
  authenticateSession,
  canUpdateDocument,
  handleValidationError,
  csrfValidation,
  updateDocument,
);

router.delete("/:id", authenticateSession, canDeleteDocument, deleteDocument);

export default router;
