import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getTemplates,
  getCertificatesByProject,
  generateDakhalaPdf
} from "../controllers/dakhala.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/templates", getTemplates);
router.get("/project/*", getCertificatesByProject);
router.get("/project", getCertificatesByProject);
router.get("/:sap_work_key(*)", getCertificatesByProject);
router.post("/generate/*", generateDakhalaPdf);
router.post("/generate", generateDakhalaPdf);
router.post("/generate/:sap_work_key(*)", generateDakhalaPdf);

export default router;
