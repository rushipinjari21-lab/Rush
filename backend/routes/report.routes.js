import express from "express";
import { getDashboardReport, getProjectReport, exportProjectReport } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", authenticate, getDashboardReport);
router.get("/project/:sap_work_key", authenticate, getProjectReport);
router.get("/project/:sap_work_key/export", authenticate, exportProjectReport);

export default router;