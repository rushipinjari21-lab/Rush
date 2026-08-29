/**
 * RA Bill Validation Service
 * PCMC BillPro - Enforces RA Bill Integrity Rules
 */
import { ApiError } from "../../middleware/error.middleware.js";

/**
 * Validate RA Bill creation parameters
 * @param {Object} data 
 */
export const validateCreateRABill = (data = {}) => {
  if (!data.sap_work_key || !String(data.sap_work_key).trim()) {
    throw new ApiError(400, "Project SAP Work Key is required");
  }
  if (!data.mb_id) {
    throw new ApiError(400, "Measurement Book reference (MB ID) is required");
  }
  if (!data.bill_number || !String(data.bill_number).trim()) {
    throw new ApiError(400, "Bill Number is required");
  }
  if (!data.bill_date) {
    throw new ApiError(400, "Bill Date is required");
  }
};

export default {
  validateCreateRABill
};

