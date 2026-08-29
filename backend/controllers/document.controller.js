/**
 * Document Center Controller
 * PCMC BillPro - Document Vault & File Download Handlers
 */
import fs from "fs";
import { param } from "express-validator";
import { DocumentModel } from "../models/document.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";

/**
 * Get documents tree / list for a project
 */
export const getProjectDocuments = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) throw new ApiError(400, "SAP Work Key is required");

  const documents = await DocumentModel.findByProject(sapKey);
  
  // Group documents into project folder structure (MBs, RA Bills, Dakhala, Reports)
  const grouped = {
    mb: [],
    raBills: [],
    dakhala: [],
    reports: [],
    other: []
  };

  documents.forEach((doc) => {
    if (doc.document_type === "MB") grouped.mb.push(doc);
    else if (doc.document_type === "RA_BILL") grouped.raBills.push(doc);
    else if (doc.document_type === "DAKHALA") grouped.dakhala.push(doc);
    else if (doc.document_type === "REPORT") grouped.reports.push(doc);
    else grouped.other.push(doc);
  });

  res.json({
    success: true,
    data: {
      sap_work_key: sapKey,
      total_documents: documents.length,
      grouped,
      all: documents
    }
  });
});

/**
 * Download document by document ID
 */
export const downloadDocument = [
  param("id").isInt().withMessage("Valid document ID is required"),
  asyncHandler(async (req, res) => {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) throw new ApiError(404, "Document not found");

    if (!fs.existsSync(doc.file_path)) {
      throw new ApiError(404, "Physical document file missing on server");
    }

    res.download(doc.file_path, doc.file_name);
  })
];

export default {
  getProjectDocuments,
  downloadDocument
};

