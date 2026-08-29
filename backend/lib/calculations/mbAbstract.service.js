/**
 * MB Abstract Service
 * PCMC BillPro - Centralized MB Abstract Aggregation & Calculation
 */

const num = (val) => Number.parseFloat(val) || 0;
const round2 = (val) => Number(num(val).toFixed(2));
const round4 = (val) => Number(num(val).toFixed(4));

/**
 * Generate MB Abstract from BOQ items, MB entries, and previous RA Bill quantities.
 * 
 * @param {Array} boqItems - List of BOQ items for the project
 * @param {Array} entries - Current MB entries (grouped by BOQ item or individual)
 * @param {Array} previousQuantities - Previous quantities for BOQ items from approved/paid RA Bills
 * @returns {Object} { items: Array, summary: Object }
 */
export const calculateMBAbstract = (boqItems = [], entries = [], previousQuantities = []) => {
  // Aggregate current MB measured quantities by boq_item_id or ssr_code
  const currentByBoqItem = new Map();
  const currentBySsr = new Map();

  entries.forEach((entry) => {
    const qty = num(entry.current_quantity ?? entry.total_quantity);
    if (entry.boq_item_id !== null && entry.boq_item_id !== undefined) {
      const key = String(entry.boq_item_id);
      currentByBoqItem.set(key, num(currentByBoqItem.get(key)) + qty);
    } else if (entry.ssr_code) {
      const key = String(entry.ssr_code);
      currentBySsr.set(key, num(currentBySsr.get(key)) + qty);
    }
  });

  // Aggregate previous quantities from past bills
  const previousByBoqItem = new Map();
  const previousBySsr = new Map();

  previousQuantities.forEach((item) => {
    const prevQty = num(item.prev_qty);
    if (item.boq_item_id !== null && item.boq_item_id !== undefined) {
      const key = String(item.boq_item_id);
      previousByBoqItem.set(key, num(previousByBoqItem.get(key)) + prevQty);
    } else if (item.ssr_code) {
      const key = String(item.ssr_code);
      previousBySsr.set(key, num(previousBySsr.get(key)) + prevQty);
    }
  });

  let totalAmount = 0;
  let totalCurrentQty = 0;

  // Process abstract for all BOQ items
  const abstractList = boqItems.map((boq, index) => {
    const boqIdKey = String(boq.id);
    const ssrKey = String(boq.ssr_code);

    const currentQty = currentByBoqItem.has(boqIdKey)
      ? num(currentByBoqItem.get(boqIdKey))
      : num(currentBySsr.get(ssrKey));

    const prevQty = previousByBoqItem.has(boqIdKey)
      ? num(previousByBoqItem.get(boqIdKey))
      : num(previousBySsr.get(ssrKey));

    const boqQty = num(boq.boq_quantity);
    const rate = num(boq.rate);
    const cumulativeQty = round4(prevQty + currentQty);
    const balanceQty = round4(boqQty - cumulativeQty);
    const amount = round2(currentQty * rate);

    totalCurrentQty += currentQty;
    totalAmount += amount;

    return {
      sr_no: index + 1,
      boq_item_id: boq.id,
      item_no: boq.item_no || String(index + 1),
      part_section: boq.part_section || "Part A",
      ssr_code: boq.ssr_code,
      additional_specification: boq.additional_specification || "",
      description: boq.description,
      unit: boq.unit,
      boq_quantity: round4(boqQty),
      rate: round2(rate),
      previous_quantity: round4(prevQty),
      current_quantity: round4(currentQty),
      total_quantity: cumulativeQty,
      balance_quantity: balanceQty,
      amount: amount
    };
  });

  // Filter to items that have measurements (or previous quantities) for display, but retain complete abstract capability
  const activeItems = abstractList.filter(item => item.current_quantity > 0 || item.previous_quantity > 0);

  return {
    items: activeItems.length ? activeItems : abstractList,
    allItems: abstractList,
    summary: {
      total_items: activeItems.length,
      total_boq_items: boqItems.length,
      total_quantity: round4(totalCurrentQty),
      total_amount: round2(totalAmount)
    }
  };
};

export default {
  calculateMBAbstract
};

