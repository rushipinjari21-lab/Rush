/**
 * Dakhala Controller
 * PCMC BillPro - Dakhala / Certificates Subsystem Handlers
 */
import fs from "fs";
import path from "path";
import { param, body, validationResult } from "express-validator";
import { DakhalaModel } from "../models/dakhala.model.js";
import { ProjectModel } from "../models/project.model.js";
import { MeasurementModel } from "../models/measurement.model.js";
import { RABillModel } from "../models/rabill.model.js";
import { DocumentModel } from "../models/document.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { DAKHALA_TEMPLATES, prepareDakhalaPayload } from "../lib/pdf/dakhalaTemplates.js";
import { generatePcmcDakhalePdf } from "../lib/pdf/dakhaleEngine.js";
import { REPORTS_DIR } from "../utils/excelExport.js";

/**
 * Get available Dakhala template registry
 */
export const getTemplates = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: Object.values(DAKHALA_TEMPLATES)
  });
});

/**
 * Get issued certificates for a project
 */
export const getCertificatesByProject = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) throw new ApiError(400, "SAP Work Key is required");
  const certs = await DakhalaModel.findByProject(sapKey);
  res.json({
    success: true,
    data: certs
  });
});

/**
 * Generate official PDF certificate for selected Dakhala template
 */
export const generateDakhalaPdf = asyncHandler(async (req, res) => {
  const sap_work_key = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sap_work_key) throw new ApiError(400, "SAP Work Key is required");
  const { template_type, mb_id, ra_bill_id } = req.body;
  if (!template_type) throw new ApiError(400, "Template type is required");

  const project = await ProjectModel.findBySapKey(sap_work_key);
  if (!project) throw new ApiError(404, "Project not found");

    const template = DAKHALA_TEMPLATES[template_type] || DAKHALA_TEMPLATES.GENERAL_DAKHALA;

    const mb = mb_id ? await MeasurementModel.findMBById(mb_id) : null;
    const raBill = ra_bill_id ? await RABillModel.getFullBill(ra_bill_id) : null;
    const entries = mb_id ? await MeasurementModel.getEntriesByMB(mb_id) : [];

    const payload = prepareDakhalaPayload(template_type, project, mb, raBill, entries);

    const headers = ["Particulars / Field", "Details / Value"];
    const colWidths = [180, 340];
    const rows = [
      ["Certificate Title", payload.title],
      ["Marathi Name", payload.marathiTitle],
      ["Work Name", payload.project.work_name],
      ["Contractor", payload.project.contractor_name],
      ["Work Order No.", payload.project.work_order_no],
      ["Tender No.", payload.project.tender_no],
      ["Department", payload.project.department],
      ["Budget Head", payload.project.budget_head],
      ["Estimated Cost", `₹${payload.project.estimated_cost}`],
      ["Start Date", payload.project.start_date],
      ["Completion Date", payload.project.completion_date],
      ["Certified Date", payload.generatedDate]
    ];

    if (payload.mb) {
      rows.push(["MB Number", payload.mb.mb_number]);
      rows.push(["MB Date", payload.mb.mb_date]);
    }

    if (payload.raBill) {
      rows.push(["RA Bill Number", payload.raBill.bill_number]);
      rows.push(["Bill Date", payload.raBill.bill_date]);
      rows.push(["Gross Amount", `₹${payload.raBill.gross_amount}`]);
      rows.push(["Net Payable", `₹${payload.raBill.net_payable}`]);
    }

    const rawPdf = await generatePcmcDakhalePdf({
      templateKey: template.id,
      project,
      bill: raBill || {}
    });

    const buf = Buffer.isBuffer(rawPdf) ? rawPdf : Buffer.from(rawPdf);

    // Save generated PDF to report directory & register in Document Center
    const safeSapWorkKey = String(project.sap_work_key || sap_work_key || "proj")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeTemplateId = String(template.id || "DAKHALA")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeTemplateId}_${safeSapWorkKey}_${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buf);

    // Save record to Dakhala table
    const cert = await DakhalaModel.create({
      sap_work_key,
      template_type: template.id,
      certificate_title: template.name,
      ra_bill_id: ra_bill_id || null,
      mb_id: mb_id || null,
      certificate_data: payload,
      created_by: req.user?.id || null
    });

    // Register in Document Center
    await DocumentModel.create({
      sap_work_key,
      document_type: "DAKHALA",
      template_type: template.id,
      mb_id: mb_id || null,
      ra_bill_id: ra_bill_id || null,
      file_name: fileName,
      file_path: filePath,
      file_size: buf.length,
      generated_by: req.user?.id || null
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Content-Length": buf.length
    });
    res.send(buf);
  });

export default {
  getTemplates,
  getCertificatesByProject,
  generateDakhalaPdf
};

