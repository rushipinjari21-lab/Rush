import express from "express";
import {
  createRABill, getRABills, getRABillDetail,
  updateStatus, deleteRABill, exportRABill, exportRABillPdf, getRABillStats
} from "../controllers/rabill.controller.js";
import { authenticate, engineerOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, engineerOrAdmin, createRABill);
router.get("/stats/dashboard", authenticate, getRABillStats);
router.get("/project/*", authenticate, getRABills);
router.get("/project", authenticate, getRABills);
router.get("/detail/:id", authenticate, getRABillDetail);
router.put("/:id/status", authenticate, engineerOrAdmin, updateStatus);
router.delete("/:id", authenticate, engineerOrAdmin, deleteRABill);
router.get("/:id/export/pdf", authenticate, exportRABillPdf);
router.get("/:id/export", authenticate, exportRABill);
router.get("/:sap_work_key(*)", authenticate, getRABills);

export default router;