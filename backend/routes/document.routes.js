import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getProjectDocuments,
  downloadDocument
} from "../controllers/document.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/project/*", getProjectDocuments);
router.get("/project", getProjectDocuments);
router.get("/download/:id", downloadDocument);
router.get("/:sap_work_key(*)", getProjectDocuments);

export default router;
