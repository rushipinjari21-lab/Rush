/**
 * BOQ Controller
 * PCMC BillPro - Bill of Quantities Management
 */
import { BOQModel } from "../models/boq.model.js";
import { ProjectModel } from "../models/project.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { body, param, validationResult } from "express-validator";
import { parseBOQPDF } from "../services/pdfParser.service.js";
import path from "path";
import fs from "fs";

/**
 * @route   POST /api/boq/upload
 * @desc    Upload and parse BOQ PDF
 * @access  Private/Engineer or Admin
 */
export const uploadBOQ = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const { sap_work_key } = req.body;
  if (!sap_work_key) {
    fs.unlinkSync(req.file.path);
    throw new ApiError(400, "SAP Work Key is required");
  }

  const project = await ProjectModel.findBySapKey(sap_work_key);
  if (!project) {
    fs.unlinkSync(req.file.path);
    throw new ApiError(404, "Project not found");
  }

  // Record upload
  const uploadId = await BOQModel.recordUpload({
    sap_work_key,
    file_name: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size,
    uploaded_by: req.user.id
  });

  try {
    // Parse PDF
    const parsedItems = await parseBOQPDF(req.file.path);

    if (!parsedItems || parsedItems.length === 0) {
      await BOQModel.updateUploadStatus(uploadId, "failed", 0, "No items extracted from PDF");
      throw new ApiError(422, "Could not extract BOQ items from PDF");
    }

    // Replace rows safely. Existing MB entries are moved to their matching
    // parsed Item No. before obsolete BOQ rows are removed.
    await BOQModel.replaceForProject(sap_work_key, parsedItems);

    // Update upload status
    await BOQModel.updateUploadStatus(uploadId, "completed", parsedItems.length, null);

    res.json({
      success: true,
      message: `BOQ uploaded successfully. ${parsedItems.length} items extracted.`,
      data: {
        upload_id: uploadId,
        total_items: parsedItems.length,
        file_name: req.file.originalname
      }
    });
  } catch (error) {
    await BOQModel.updateUploadStatus(uploadId, "failed", 0, error.message);
    throw error;
  }
});

/**
 * @route   GET /api/boq/:sap_work_key
 * @desc    Get BOQ items by SAP Work Key
 * @access  Private
 */
export const getBOQByProject = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) {
    throw new ApiError(400, "SAP Work Key is required");
  }

  const { part_section } = req.query;
  const items = await BOQModel.findBySapKey(sapKey, part_section);

  res.json({
    success: true,
    data: items
  });
});

/**
 * @route   GET /api/boq/:sap_work_key/search
 * @desc    Search BOQ by SSR Code
 * @access  Private
 */
export const searchBOQ = asyncHandler(async (req, res) => {
  const sapKey = req.query.sap_work_key || req.params[0] || req.params.sap_work_key;
  if (!sapKey) {
    throw new ApiError(400, "SAP Work Key is required");
  }

  const { ssr_code } = req.query;
  if (!ssr_code) {
    throw new ApiError(400, "SSR Code search term is required");
  }

  const items = await BOQModel.searchBySsrCode(sapKey, ssr_code);

  res.json({
    success: true,
    data: items
  });
});

/**
 * @route   POST /api/boq/:sap_work_key/items
 * @desc    Add single BOQ item
 * @access  Private/Engineer or Admin
 */
export const addBOQItem = [
  param("sap_work_key").trim().notEmpty().withMessage("SAP Work Key is required"),
  body("ssr_code").trim().notEmpty().withMessage("SSR Code is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("unit").trim().notEmpty().withMessage("Unit is required"),
  body("boq_quantity").isFloat({ min: 0 }).withMessage("BOQ Quantity must be positive"),
  body("rate").isFloat({ min: 0 }).withMessage("Rate must be positive"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const project = await ProjectModel.findBySapKey(req.params.sap_work_key);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const item = await BOQModel.create({
      sap_work_key: req.params.sap_work_key,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: "BOQ item added successfully",
      data: item
    });
  })
];

/**
 * @route   PUT /api/boq/items/:id
 * @desc    Update BOQ item
 * @access  Private/Engineer or Admin
 */
export const updateBOQItem = [
  param("id").isInt().withMessage("Valid item ID is required"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const existing = await BOQModel.findById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "BOQ item not found");
    }

    const updated = await BOQModel.update(req.params.id, req.body);

    res.json({
      success: true,
      message: "BOQ item updated successfully",
      data: updated
    });
  })
];

/**
 * @route   DELETE /api/boq/items/:id
 * @desc    Delete BOQ item
 * @access  Private/Admin
 */
export const deleteBOQItem = [
  param("id").isInt().withMessage("Valid item ID is required"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const existing = await BOQModel.findById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "BOQ item not found");
    }

    await BOQModel.delete(req.params.id);

    res.json({
      success: true,
      message: "BOQ item deleted successfully"
    });
  })
];

/**
 * @route   GET /api/boq/:sap_work_key/stats
 * @desc    Get BOQ statistics
 * @access  Private
 */
export const getBOQStats = [
  param("sap_work_key").trim().notEmpty().withMessage("SAP Work Key is required"),
  asyncHandler(async (req, res) => {
    const stats = await BOQModel.getStats(req.params.sap_work_key);
    res.json({
      success: true,
      data: stats
    });
  })
];

export default {
  uploadBOQ, getBOQByProject, searchBOQ,
  addBOQItem, updateBOQItem, deleteBOQItem, getBOQStats
};
