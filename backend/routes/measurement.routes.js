import express from "express";
import {
  createMB, getMBsByProject, getMBDetail,
  addEntry, updateEntry, deleteEntry,
  deleteMB, exportMB, exportMBPdf, exportAbstract, exportAbstractPdf,
  exportQuantityVariationSheet, exportQuantityVariationPdf, getQuantityVariationData, exportAllDocuments,
  getMBStats
} from "../controllers/measurement.controller.js";
import { authenticate, engineerOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, engineerOrAdmin, createMB);
router.get("/stats/dashboard", authenticate, getMBStats);
router.get("/project/*", authenticate, getMBsByProject);
router.get("/project", authenticate, getMBsByProject);
router.get("/detail/:id", authenticate, getMBDetail);
router.post("/:id/entries", authenticate, engineerOrAdmin, addEntry);
router.put("/entries/:entryId", authenticate, engineerOrAdmin, updateEntry);
router.delete("/entries/:entryId", authenticate, engineerOrAdmin, deleteEntry);
router.delete("/:id", authenticate, engineerOrAdmin, deleteMB);
router.get("/:id/export/pdf", authenticate, exportMBPdf);
router.get("/:id/export/abstract/pdf", authenticate, exportAbstractPdf);
router.get("/:id/export", authenticate, exportMB);
router.get("/:id/export/abstract", authenticate, exportAbstract);
router.get("/:id/quantity-variation", authenticate, getQuantityVariationData);
router.get("/:id/export/quantity-variation", authenticate, exportQuantityVariationSheet);
router.get("/:id/export/quantity-variation/pdf", authenticate, exportQuantityVariationPdf);
router.get("/:id/export/documents", authenticate, exportAllDocuments);
router.get("/:sap_work_key(*)", authenticate, getMBsByProject);

export default router;