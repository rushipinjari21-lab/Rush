import express from "express";
import {
  uploadBOQ, getBOQByProject, searchBOQ,
  addBOQItem, updateBOQItem, deleteBOQItem, getBOQStats
} from "../controllers/boq.controller.js";
import { authenticate, engineerOrAdmin, adminOnly } from "../middleware/auth.middleware.js";
import { upload, handleUploadError } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/upload", authenticate, engineerOrAdmin, upload.single("boq_pdf"), handleUploadError, uploadBOQ);
router.get("/project/*", authenticate, getBOQByProject);
router.get("/stats/*", authenticate, getBOQStats);
router.get("/search/*", authenticate, searchBOQ);
router.get("/:sap_work_key(*)/search", authenticate, searchBOQ);
router.get("/:sap_work_key(*)/stats", authenticate, getBOQStats);
router.get("/:sap_work_key(*)", authenticate, getBOQByProject);
router.get("/", authenticate, getBOQByProject);
router.post("/:sap_work_key(*)/items", authenticate, engineerOrAdmin, addBOQItem);
router.put("/items/:id", authenticate, engineerOrAdmin, updateBOQItem);
router.delete("/items/:id", authenticate, adminOnly, deleteBOQItem);

export default router;