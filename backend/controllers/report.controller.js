/**
 * Report Controller
 * PCMC BillPro - Reports & Analytics
 */
import { ProjectModel } from "../models/project.model.js";
import { BOQModel } from "../models/boq.model.js";
import { MeasurementModel } from "../models/measurement.model.js";
import { RABillModel } from "../models/rabill.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { param, validationResult } from "express-validator";
import { exportReportToExcel } from "../utils/excelExport.js";

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get dashboard summary
 * @access  Private
 */
export const getDashboardReport = asyncHandler(async (req, res) => {
  const [projectStats, mbStats, raStats] = await Promise.all([
    ProjectModel.getStats(),
    MeasurementModel.getStats(),
    RABillModel.getStats()
  ]);

  res.json({
    success: true,
    data: {
      projects: projectStats,
      measurementBooks: mbStats,
      raBills: raStats
    }
  });
});

/**
 * @route   GET /api/reports/project/:sap_work_key
 * @desc    Get complete project report
 * @access  Private
 */
export const getProjectReport = [
  param("sap_work_key").trim().notEmpty().withMessage("SAP Work Key is required"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const sapWorkKey = req.params.sap_work_key;
    const [project, boqItems, mbs, raBills] = await Promise.all([
      ProjectModel.findBySapKey(sapWorkKey),
      BOQModel.findBySapKey(sapWorkKey),
      MeasurementModel.findMBsBySapKey(sapWorkKey),
      RABillModel.findBySapKey(sapWorkKey)
    ]);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const boqStats = await BOQModel.getStats(sapWorkKey);

    res.json({
      success: true,
      data: {
        project,
        boq: { items: boqItems, stats: boqStats },
        measurementBooks: mbs,
        raBills
      }
    });
  })
];

/**
 * @route   GET /api/reports/project/:sap_work_key/export
 * @desc    Export project report to Excel
 * @access  Private
 */
export const exportProjectReport = [
  param("sap_work_key").trim().notEmpty().withMessage("SAP Work Key is required"),
  asyncHandler(async (req, res) => {
    const sapWorkKey = req.params.sap_work_key;
    const [project, boqItems, mbs, raBills] = await Promise.all([
      ProjectModel.findBySapKey(sapWorkKey),
      BOQModel.findBySapKey(sapWorkKey),
      MeasurementModel.findMBsBySapKey(sapWorkKey),
      RABillModel.findBySapKey(sapWorkKey)
    ]);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const filePath = await exportReportToExcel(project, boqItems, mbs, raBills);
    res.download(filePath, `Report_${sapWorkKey}.xlsx`, (err) => {
      if (err) console.error("Download error:", err);
    });
  })
];

export default { getDashboardReport, getProjectReport, exportProjectReport };
