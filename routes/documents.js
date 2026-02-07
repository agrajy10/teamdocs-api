import { Router } from "express";
import handleValidationError from "../middleware/validation.middleware.js";
import { body } from "express-validator";
import authenticateSession from "../middleware/authenticateSession.js";
import authorize from "../middleware/authorize.js";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  getMyDocuments,
  updateDocument,
  viewDocument,
} from "../services/documents.js";
import csrfValidation from "../middleware/csrf.middleware.js";
import canDeleteDocument from "../middleware/canDeleteDocument.js";
import canViewDocument from "../middleware/canViewDocument.js";
import canUpdateDocument from "../middleware/canUpdateDocument.js";
import checkDocumentExists from "../middleware/checkDocumentExists.js";
import limiter from "../middleware/rateLimiter.js";

const router = Router();

router.post(
  "/",
  limiter,
  [body("title").notEmpty(), body("content").notEmpty().bail().isString()],
  authenticateSession,
  authorize("docs:create"),
  handleValidationError,
  csrfValidation,
  createDocument,
);

router.get("/my-documents", authenticateSession, getMyDocuments);

router.get("/", authenticateSession, authorize("docs:view"), getDocuments);

router.get(
  "/:id",
  authenticateSession,
  checkDocumentExists,
  canViewDocument,
  viewDocument,
);

router.put(
  "/:id",
  limiter,
  [body("title").notEmpty(), body("content").notEmpty().bail().isString()],
  authenticateSession,
  checkDocumentExists,
  canUpdateDocument,
  handleValidationError,
  csrfValidation,
  updateDocument,
);

router.delete(
  "/:id",
  authenticateSession,
  checkDocumentExists,
  canDeleteDocument,
  deleteDocument,
);

export default router;
