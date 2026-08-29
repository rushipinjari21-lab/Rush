/**
 * Project Validation Service
 * PCMC BillPro - Enforces Project Master Data Integrity
 */
import { ApiError } from "../../middleware/error.middleware.js";

/**
 * Validate Project creation/update data
 * @param {Object} data 
 */
export const validateProjectData = (data = {}) => {
  if (!data.sap_work_key || !String(data.sap_work_key).trim()) {
    throw new ApiError(400, "SAP Work Key is required");
  }
  if (!data.work_name || !String(data.work_name).trim()) {
    throw new ApiError(400, "Work Name is required");
  }
  if (!data.contractor_name || !String(data.contractor_name).trim()) {
    throw new ApiError(400, "Contractor Name is required");
  }
  if (!data.work_order_no || !String(data.work_order_no).trim()) {
    throw new ApiError(400, "Work Order Number is required");
  }
  if (!data.department || !String(data.department).trim()) {
    throw new ApiError(400, "Department is required");
  }
  if (!data.budget_head || !String(data.budget_head).trim()) {
    throw new ApiError(400, "Budget Head is required");
  }
};

export default {
  validateProjectData
};

