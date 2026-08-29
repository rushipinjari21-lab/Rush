/**
 * Project Controller
 * PCMC BillPro - Project Master Management
 */
import { ProjectModel } from "../models/project.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { body, param, validationResult } from "express-validator";

// A browser can lose the response after MySQL has already saved a new project.
// Comparing the natural project key and submitted values lets a repeated click
// finish successfully, while still rejecting a genuinely different project
// that reuses the same SAP Work Key.
const normaliseText = (value) => String(value ?? "").trim();
const normaliseCost = (value) => {
  const cost = Number(value ?? 0);
  return Number.isFinite(cost) ? cost.toFixed(2) : "";
};
const normaliseDate = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};
const isSameProjectCreate = (existing, submitted) => (
  normaliseText(existing.work_name) === normaliseText(submitted.work_name)
  && normaliseText(existing.contractor_name) === normaliseText(submitted.contractor_name)
  && normaliseText(existing.work_order_no) === normaliseText(submitted.work_order_no)
  && normaliseText(existing.tender_no) === normaliseText(submitted.tender_no)
  && normaliseText(existing.department) === normaliseText(submitted.department)
  && normaliseText(existing.budget_head) === normaliseText(submitted.budget_head)
  && normaliseCost(existing.estimated_cost) === normaliseCost(submitted.estimated_cost)
  && normaliseDate(existing.start_date) === normaliseDate(submitted.start_date)
  && normaliseDate(existing.completion_date) === normaliseDate(submitted.completion_date)
  && normaliseText(existing.status || "active") === normaliseText(submitted.status || "active")
  && normaliseText(existing.remarks) === normaliseText(submitted.remarks)
);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private/Admin or Engineer
 */
export const createProject = [
  body("sap_work_key").trim().notEmpty().withMessage("SAP Work Key is required"),
  body("work_name").trim().notEmpty().withMessage("Work Name is required"),
  body("contractor_name").trim().notEmpty().withMessage("Contractor Name is required"),
  body("work_order_no").trim().notEmpty().withMessage("Work Order No is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("budget_head").trim().notEmpty().withMessage("Budget Head is required"),
  body("estimated_cost").isFloat({ min: 0 }).withMessage("Estimated cost must be a positive number"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const existing = await ProjectModel.findBySapKey(req.body.sap_work_key);
    if (existing) {
      if (isSameProjectCreate(existing, req.body)) {
        return res.status(200).json({
          success: true,
          message: "Project was already saved",
          data: existing
        });
      }
      throw new ApiError(409, "Project with this SAP Work Key already exists");
    }

    let project;
    try {
      project = await ProjectModel.create({
        ...req.body,
        created_by: req.user.id
      });
    } catch (error) {
      // Two rapid clicks can pass the first lookup together. If the first
      // request already created this exact project, complete the second one
      // successfully instead of displaying a false save failure.
      if (error.code === "ER_DUP_ENTRY") {
        const savedProject = await ProjectModel.findBySapKey(req.body.sap_work_key);
        if (savedProject && isSameProjectCreate(savedProject, req.body)) {
          return res.status(200).json({
            success: true,
            message: "Project was already saved",
            data: savedProject
          });
        }
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project
    });
  })
];

/**
 * @route   GET /api/projects
 * @desc    Get all projects with pagination
 * @access  Private
 */
export const getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "", status = "", department = "" } = req.query;

  const result = await ProjectModel.findAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    status,
    department
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * @route   GET /api/projects/:sap_work_key
 * @desc    Get project by SAP Work Key
 * @access  Private
 */
export const getProjectBySapKey = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) {
    throw new ApiError(400, "SAP Work Key is required");
  }

  const project = await ProjectModel.findBySapKey(sapKey);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  res.json({
    success: true,
    data: project
  });
});

/**
 * @route   PUT /api/projects/:sap_work_key
 * @desc    Update project
 * @access  Private/Admin or Engineer
 */
export const updateProject = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) {
    throw new ApiError(400, "SAP Work Key is required");
  }

  const project = await ProjectModel.findBySapKey(sapKey);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const updated = await ProjectModel.update(sapKey, req.body);

  res.json({
    success: true,
    message: "Project updated successfully",
    data: updated
  });
});

/**
 * @route   DELETE /api/projects/:sap_work_key
 * @desc    Delete project
 * @access  Private/Admin
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) {
    throw new ApiError(400, "SAP Work Key is required");
  }

  const project = await ProjectModel.findBySapKey(sapKey);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  await ProjectModel.delete(sapKey);

  res.json({
    success: true,
    message: "Project deleted successfully"
  });
});

/**
 * @route   GET /api/projects/stats/dashboard
 * @desc    Get project statistics for dashboard
 * @access  Private
 */
export const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await ProjectModel.getStats();
  const departments = await ProjectModel.getDepartments();

  res.json({
    success: true,
    data: { ...stats, departments }
  });
});

/**
 * @route   GET /api/projects/departments/list
 * @desc    Get distinct departments
 * @access  Private
 */
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await ProjectModel.getDepartments();
  res.json({
    success: true,
    data: departments.map(d => d.department)
  });
});

export default {
  createProject, getProjects, getProjectBySapKey,
  updateProject, deleteProject, getProjectStats, getDepartments
};
