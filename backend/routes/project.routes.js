import express from "express";
import {
  createProject, getProjects, getProjectBySapKey,
  updateProject, deleteProject, getProjectStats, getDepartments
} from "../controllers/project.controller.js";
import { authenticate, engineerOrAdmin, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, engineerOrAdmin, createProject);
router.get("/", authenticate, getProjects);
router.get("/stats/dashboard", authenticate, getProjectStats);
router.get("/departments/list", authenticate, getDepartments);
router.get("/detail/*", authenticate, getProjectBySapKey);
router.get("/:sap_work_key(*)", authenticate, getProjectBySapKey);
router.put("/detail/*", authenticate, engineerOrAdmin, updateProject);
router.put("/:sap_work_key(*)", authenticate, engineerOrAdmin, updateProject);
router.delete("/detail/*", authenticate, adminOnly, deleteProject);
router.delete("/:sap_work_key(*)", authenticate, adminOnly, deleteProject);

export default router;