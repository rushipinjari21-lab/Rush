/**
 * Abstract Controller
 * PCMC BillPro - Abstract Generation from Measurement Book
 */
import { MeasurementModel } from "../models/measurement.model.js";
import { BOQModel } from "../models/boq.model.js";
import { RABillModel } from "../models/rabill.model.js";
import { ProjectModel } from "../models/project.model.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { param, validationResult } from "express-validator";
import { exportAbstractToExcel } from "../utils/excelExport.js";

/**
 * @route   GET /api/abstract/:mb_id
 * @desc    Generate abstract from Measurement Book
 * @access  Private
 */
export const generateAbstract = [
  param("mb_id").isInt().withMessage("Valid MB ID is required"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const mb = await MeasurementModel.findMBById(req.params.mb_id);
    if (!mb) {
      throw new ApiError(404, "Measurement Book not found");
    }

    // Get current MB entries grouped by SSR
    const currentEntries = await MeasurementModel.getEntriesGroupedBySSR(req.params.mb_id);

    // Get all BOQ items for the project
    const boqItems = await BOQModel.findBySapKey(mb.sap_work_key);

    // Get previous bill quantities
    const prevQuantities = await RABillModel.getPreviousQuantities(mb.sap_work_key);
    const prevQtyMap = {};
    prevQuantities.forEach(pq => {
      const key = pq.boq_item_id !== null && pq.boq_item_id !== undefined
        ? `boq:${pq.boq_item_id}`
        : `ssr:${pq.ssr_code}`;
      prevQtyMap[key] = (prevQtyMap[key] || 0) + (parseFloat(pq.prev_qty) || 0);
    });

    // Build abstract items
    const abstractItems = boqItems.map(boq => {
      const current = currentEntries.find(e => Number(e.boq_item_id) === Number(boq.id));
      const currentQty = current ? parseFloat(current.current_quantity) || 0 : 0;
      const prevQty = prevQtyMap[`boq:${boq.id}`] ?? prevQtyMap[`ssr:${boq.ssr_code}`] ?? 0;
      const totalQty = prevQty + currentQty;
      const balanceQty = parseFloat(boq.boq_quantity) - totalQty;
      const amount = currentQty * parseFloat(boq.rate);

      return {
        ssr_code: boq.ssr_code,
        description: boq.description,
        unit: boq.unit,
        boq_quantity: parseFloat(boq.boq_quantity),
        rate: parseFloat(boq.rate),
        previous_quantity: prevQty,
        current_quantity: currentQty,
        total_quantity: totalQty,
        balance_quantity: balanceQty,
        amount: amount
      };
    }).filter(item => item.current_quantity > 0 || item.previous_quantity > 0);

    const totalAmount = abstractItems.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      success: true,
      data: {
        mb_id: mb.id,
        mb_number: mb.mb_number,
        sap_work_key: mb.sap_work_key,
        items: abstractItems,
        summary: {
          total_items: abstractItems.length,
          total_amount: totalAmount,
          total_current_quantity: abstractItems.reduce((sum, i) => sum + i.current_quantity, 0),
          total_previous_quantity: abstractItems.reduce((sum, i) => sum + i.previous_quantity, 0)
        }
      }
    });
  })
];

/**
 * @route   GET /api/abstract/:mb_id/export
 * @desc    Export abstract to Excel
 * @access  Private
 */
export const exportAbstract = [
  param("mb_id").isInt().withMessage("Valid MB ID is required"),
  asyncHandler(async (req, res) => {
    const mb = await MeasurementModel.findMBById(req.params.mb_id);
    if (!mb) {
      throw new ApiError(404, "Measurement Book not found");
    }

    const currentEntries = await MeasurementModel.getEntriesGroupedBySSR(req.params.mb_id);
    const boqItems = await BOQModel.findBySapKey(mb.sap_work_key);
    const prevQuantities = await RABillModel.getPreviousQuantities(mb.sap_work_key);
    const project = await ProjectModel.findBySapKey(mb.sap_work_key);

    const prevQtyMap = {};
    prevQuantities.forEach(pq => {
      const key = pq.boq_item_id !== null && pq.boq_item_id !== undefined
        ? `boq:${pq.boq_item_id}`
        : `ssr:${pq.ssr_code}`;
      prevQtyMap[key] = (prevQtyMap[key] || 0) + (parseFloat(pq.prev_qty) || 0);
    });

    const abstractItems = boqItems.map(boq => {
      const current = currentEntries.find(e => Number(e.boq_item_id) === Number(boq.id));
      const currentQty = current ? parseFloat(current.current_quantity) || 0 : 0;
      const prevQty = prevQtyMap[`boq:${boq.id}`] ?? prevQtyMap[`ssr:${boq.ssr_code}`] ?? 0;
      const totalQty = prevQty + currentQty;
      const balanceQty = parseFloat(boq.boq_quantity) - totalQty;
      const amount = currentQty * parseFloat(boq.rate);

      return {
        ssr_code: boq.ssr_code,
        description: boq.description,
        unit: boq.unit,
        boq_quantity: parseFloat(boq.boq_quantity),
        rate: parseFloat(boq.rate),
        previous_quantity: prevQty,
        current_quantity: currentQty,
        total_quantity: totalQty,
        balance_quantity: balanceQty,
        amount: amount
      };
    }).filter(item => item.current_quantity > 0 || item.previous_quantity > 0);

    const filePath = await exportAbstractToExcel(mb, abstractItems, project);

    res.download(filePath, `Abstract_${mb.mb_number}.xlsx`, (err) => {
      if (err) console.error("Download error:", err);
    });
  })
];

export default { generateAbstract, exportAbstract };
