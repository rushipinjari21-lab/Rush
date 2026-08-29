/**
 * MB Validation Service
 * PCMC BillPro - Enforces Mandatory Measurement Book Rules
 */
import { ApiError } from "../../middleware/error.middleware.js";

/**
 * Validate MB creation data
 * @param {Object} data 
 */
export const validateCreateMB = (data = {}) => {
  if (!data.sap_work_key || !String(data.sap_work_key).trim()) {
    throw new ApiError(400, "Project SAP Work Key is required");
  }
  if (!data.mb_number || !String(data.mb_number).trim()) {
    throw new ApiError(400, "MB Number is required");
  }
  if (!data.mb_date) {
    throw new ApiError(400, "MB Date is required");
  }
};

/**
 * Validate MB Entry data.
 * MANDATORY FIELDS:
 * - Date
 * - Location
 * - Remark
 * - BOQ Item
 * - Measurement (Length/Breadth/Height/Qty)
 * 
 * @param {Object} data 
 */
export const validateMBEntry = (data = {}) => {
  if (!data.boq_item_id) {
    throw new ApiError(400, "BOQ Item is required for measurement entry");
  }
  if (!data.location || !String(data.location).trim()) {
    throw new ApiError(400, "Location is required for measurement entry");
  }
  if (!data.entry_date) {
    throw new ApiError(400, "Entry Date is required");
  }

  const length = Number(data.length) || 0;
  const breadth = Number(data.breadth) || 0;
  const height = Number(data.height) || 0;
  const quantity = Number(data.quantity) || 0;

  if (length === 0 && breadth === 0 && height === 0 && quantity === 0) {
    throw new ApiError(400, "Valid measurement dimensions or quantity must be provided");
  }
};

export default {
  validateCreateMB,
  validateMBEntry
};

