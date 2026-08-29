/**
 * RA Bill Controller
 * PCMC BillPro - Running Account Bill Management
 */
import { RABillModel } from "../models/rabill.model.js";
import { MeasurementModel } from "../models/measurement.model.js";
import { BOQModel } from "../models/boq.model.js";
import { ProjectModel } from "../models/project.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { body, param, validationResult } from "express-validator";
import { exportRABillToExcel } from "../utils/excelExport.js";
import { calculateRaBill } from "../lib/calculations/raBillCalculation.service.js";
import { validateCreateRABill } from "../lib/validation/raBill.validation.js";
import { DocumentModel } from "../models/document.model.js";
import { generateOfficialRABillPdf } from "../lib/pdf/pdfEngine.js";

const optionalNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, "Bill rates and deductions must be non-negative numbers");
  }
  return parsed;
};

/**
 * @route   POST /api/ra-bills
 * @desc    Create RA Bill from MB
 * @access  Private/Engineer or Admin
 */
export const createRABill = [
  body("sap_work_key").trim().notEmpty().withMessage("SAP Work Key is required"),
  body("mb_id").isInt().withMessage("Valid MB ID is required"),
  body("bill_number").trim().notEmpty().withMessage("Bill Number is required"),
  body("bill_date").isISO8601().withMessage("Valid bill date is required"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const { sap_work_key, mb_id, bill_number, bill_date, bill_period_from, bill_period_to, remarks } = req.body;

    const project = await ProjectModel.findBySapKey(sap_work_key);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const mb = await MeasurementModel.findMBById(mb_id);
    if (!mb || mb.sap_work_key !== sap_work_key) {
      throw new ApiError(400, "Invalid Measurement Book for this project");
    }

    const existing = await RABillModel.findByBillNumber(sap_work_key, bill_number);
    if (existing) {
      throw new ApiError(409, "RA Bill with this number already exists");
    }

    const existingForMB = await RABillModel.findByMBId(mb_id);
    if (existingForMB) {
      throw new ApiError(409, `Measurement Book ${mb.mb_number} is already linked to RA Bill ${existingForMB.bill_number}`);
    }

    const currentEntries = await MeasurementModel.getEntriesGroupedBySSR(mb_id);
    if (!currentEntries.some((entry) => (parseFloat(entry.current_quantity) || 0) > 0)) {
      throw new ApiError(400, "Add at least one non-zero measurement entry before creating an RA Bill");
    }

    const prevQuantities = await RABillModel.getPreviousQuantities(sap_work_key);
    const boqItems = await BOQModel.findBySapKey(sap_work_key);

    const calculated = calculateRaBill({
      boqItems,
      currentEntries,
      previousQuantities: prevQuantities,
      ratesAndDeductions: {
        gst_rate: req.body.gst_rate,
        labour_cess_rate: req.body.labour_cess_rate,
        security_deposit_rate: req.body.security_deposit_rate,
        other_deductions: req.body.other_deductions
      }
    });

    const {
      billItems, grossAmount, gstRate, gstAmount,
      labourCessRate, labourCessAmount, securityDepositRate,
      securityDepositAmount, otherDeductions, netPayable
    } = calculated;

    // Create RA Bill
    let raBill;
    try {
      raBill = await RABillModel.create({
        sap_work_key,
        mb_id,
        bill_number,
        bill_date,
        bill_period_from,
        bill_period_to,
        gross_amount: grossAmount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        labour_cess_rate: labourCessRate,
        labour_cess_amount: labourCessAmount,
        security_deposit_rate: securityDepositRate,
        security_deposit_amount: securityDepositAmount,
        other_deductions: otherDeductions,
        net_payable: netPayable,
        remarks,
        created_by: req.user.id
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new ApiError(409, "This Measurement Book or RA Bill number is already in use");
      }
      throw error;
    }

    // Add bill items
    if (billItems.length > 0) {
      await RABillModel.addItems(raBill.id, billItems);
    }

    const fullBill = await RABillModel.getFullBill(raBill.id);

    res.status(201).json({
      success: true,
      message: "RA Bill created successfully",
      data: fullBill
    });
  })
];

/**
 * @route   GET /api/ra-bills/:sap_work_key
 * @desc    Get all RA Bills for a project
 * @access  Private
 */
export const getRABills = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) throw new ApiError(400, "SAP Work Key is required");
  const bills = await RABillModel.findBySapKey(sapKey);
  res.json({
    success: true,
    data: bills
  });
});

/**
 * @route   GET /api/ra-bills/detail/:id
 * @desc    Get RA Bill with items
 * @access  Private
 */
export const getRABillDetail = [
  param("id").isInt().withMessage("Valid RA Bill ID is required"),
  asyncHandler(async (req, res) => {
    const bill = await RABillModel.getFullBill(req.params.id);
    if (!bill) {
      throw new ApiError(404, "RA Bill not found");
    }
    res.json({
      success: true,
      data: bill
    });
  })
];

/**
 * @route   PUT /api/ra-bills/:id/status
 * @desc    Update RA Bill status
 * @access  Private/Admin or Accountant
 */
export const updateStatus = [
  param("id").isInt().withMessage("Valid RA Bill ID is required"),
  body("status").isIn(["draft", "submitted", "verified", "approved", "paid"]).withMessage("Invalid status"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const bill = await RABillModel.findById(req.params.id);
    if (!bill) {
      throw new ApiError(404, "RA Bill not found");
    }

    await RABillModel.updateStatus(req.params.id, req.body.status);
    const mbStatus = req.body.status === "verified"
      ? "verified"
      : ["approved", "paid"].includes(req.body.status)
        ? "approved"
        : "draft";
    await MeasurementModel.updateMBStatus(bill.mb_id, mbStatus);

    res.json({
      success: true,
      message: "Status updated successfully"
    });
  })
];

/**
 * @route   DELETE /api/ra-bills/:id
 * @desc    Delete RA Bill
 * @access  Private/Engineer or Admin
 */
export const deleteRABill = [
  param("id").isInt().withMessage("Valid RA Bill ID is required"),
  asyncHandler(async (req, res) => {
    const bill = await RABillModel.findById(req.params.id);
    if (!bill) {
      throw new ApiError(404, "RA Bill not found");
    }

    if (bill.mb_id) {
      await MeasurementModel.updateMBStatus(bill.mb_id, "draft");
    }

    await RABillModel.delete(req.params.id);

    res.json({
      success: true,
      message: `RA Bill ${bill.bill_number} deleted successfully`
    });
  })
];

/**
 * @route   GET /api/ra-bills/:id/export/pdf
 * @desc    Export Official A4 Landscape RA Bill PDF
 * @access  Private
 */
export const exportRABillPdf = [
  param("id").isInt().withMessage("Valid RA Bill ID is required"),
  asyncHandler(async (req, res) => {
    const bill = await RABillModel.getFullBill(req.params.id);
    if (!bill) {
      throw new ApiError(404, "RA Bill not found");
    }

    const project = await ProjectModel.findBySapKey(bill.sap_work_key);
    const mb = bill.mb_id ? await MeasurementModel.findMBById(bill.mb_id) : null;
    const entries = bill.mb_id ? await MeasurementModel.getEntriesByMB(bill.mb_id) : [];

    const paperSize = req.query.paperSize || req.query.paper_size || "A4";

    const pdfBuffer = await generateOfficialRABillPdf({
      bill,
      project: project || { sap_work_key: bill.sap_work_key },
      mb: mb || { mb_number: bill.bill_number, mb_date: bill.bill_date },
      items: bill.items || [],
      entries,
      paperSize
    });

    const buf = Buffer.from(pdfBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Disposition", `inline; filename=RA_Bill_${bill.bill_number}_${paperSize}.pdf`);
    res.send(buf);
  })
];

/**
 * @route   GET /api/ra-bills/:id/export
 * @desc    Export RA Bill to Excel
 * @access  Private
 */
export const exportRABill = [
  param("id").isInt().withMessage("Valid RA Bill ID is required"),
  asyncHandler(async (req, res) => {
    const bill = await RABillModel.getFullBill(req.params.id);
    if (!bill) {
      throw new ApiError(404, "RA Bill not found");
    }

    const project = await ProjectModel.findBySapKey(bill.sap_work_key);
    const mb = await MeasurementModel.findMBById(bill.mb_id);

    const filePath = await exportRABillToExcel(bill, project, mb);

    try {
      await DocumentModel.create({
        sap_work_key: bill.sap_work_key,
        document_type: "RA_BILL",
        ra_bill_id: bill.id,
        mb_id: bill.mb_id,
        file_name: `RA_Bill_${bill.bill_number}.xlsx`,
        file_path: filePath,
        generated_by: req.user?.id || null
      });
    } catch (e) {
      console.warn("Could not auto-register RA Bill in Document Center:", e.message);
    }

    res.download(filePath, `RA_Bill_${bill.bill_number}.xlsx`, (err) => {
      if (err) console.error("Download error:", err);
    });
  })
];

/**
 * @route   GET /api/ra-bills/stats/dashboard
 * @desc    Get RA Bill statistics
 * @access  Private
 */
export const getRABillStats = asyncHandler(async (req, res) => {
  const stats = await RABillModel.getStats();
  res.json({
    success: true,
    data: stats
  });
});

export default {
  createRABill, getRABills, getRABillDetail,
  updateStatus, deleteRABill, exportRABill, exportRABillPdf, getRABillStats
};
