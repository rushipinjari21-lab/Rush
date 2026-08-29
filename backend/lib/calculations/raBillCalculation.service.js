/**
 * RA Bill Calculation Service
 * PCMC BillPro - Single Source of Truth for Financial & Recovery Calculations
 */

const num = (val) => Number.parseFloat(val) || 0;
const round2 = (val) => Number(num(val).toFixed(2));
const round4 = (val) => Number(num(val).toFixed(4));

/**
 * Convert currency amount to Indian-English words
 * @param {number} amount 
 * @returns {string} e.g. "One Lakh Twenty Thousand Rupees and Fifty Paise Only"
 */
export const numberToWords = (amount) => {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const belowHundred = (n) => n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
  const belowThousand = (n) => n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${belowHundred(n % 100)}` : ""}` : belowHundred(n);

  const val = num(amount);
  const integer = Math.floor(Math.abs(val));
  const chunks = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];

  let remainder = integer;
  const words = [];

  for (const [divisor, label] of chunks) {
    const chunk = Math.floor(remainder / divisor);
    if (chunk) words.push(`${belowThousand(chunk)} ${label}`);
    remainder %= divisor;
  }

  if (remainder || !words.length) words.push(belowThousand(remainder) || "Zero");
  const paise = Math.round((Math.abs(val) - integer) * 100);

  return `${val < 0 ? "Minus " : ""}${words.join(" ")} Rupees${paise ? ` and ${belowHundred(paise)} Paise` : ""} Only`;
};

/**
 * Calculate complete RA Bill line items and financial summary
 * 
 * @param {Object} params
 * @param {Array} params.boqItems - Project BOQ items
 * @param {Array} params.currentEntries - Current MB grouped entries
 * @param {Array} params.previousQuantities - Previous bill quantities
 * @param {Object} params.ratesAndDeductions - Rates and fixed deduction overrides
 * @returns {Object} { billItems, grossAmount, gstAmount, labourCessAmount, securityDepositAmount, otherDeductions, netPayable, amountInWords }
 */
export const calculateRaBill = ({
  boqItems = [],
  currentEntries = [],
  previousQuantities = [],
  ratesAndDeductions = {}
}) => {
  const prevQtyByBoqItem = {};
  const prevQtyBySsr = {};

  previousQuantities.forEach(pq => {
    const previousQuantity = num(pq.prev_qty);
    if (pq.boq_item_id !== null && pq.boq_item_id !== undefined) {
      prevQtyByBoqItem[pq.boq_item_id] = (prevQtyByBoqItem[pq.boq_item_id] || 0) + previousQuantity;
    } else if (pq.ssr_code) {
      prevQtyBySsr[pq.ssr_code] = (prevQtyBySsr[pq.ssr_code] || 0) + previousQuantity;
    }
  });

  let grossAmount = 0;
  const billItems = [];

  currentEntries.forEach(entry => {
    const boq = boqItems.find(b => Number(b.id) === Number(entry.boq_item_id)) 
      || boqItems.find(b => b.ssr_code === entry.ssr_code);

    if (!boq) return;

    const currentQty = round4(num(entry.current_quantity ?? entry.total_quantity));
    const prevQty = round4(prevQtyByBoqItem[boq.id] ?? prevQtyBySsr[entry.ssr_code] ?? 0);
    const totalQty = round4(prevQty + currentQty);
    const boqQty = round4(num(boq.boq_quantity));
    const balanceQty = round4(boqQty - totalQty);
    const rate = round2(num(boq.rate));
    const amount = round2(currentQty * rate);
    const cumulativeAmount = round2(totalQty * rate);
    const previousAmount = round2(prevQty * rate);

    grossAmount += amount;

    billItems.push({
      boq_item_id: boq.id,
      item_no: boq.item_no || "",
      ssr_code: entry.ssr_code || boq.ssr_code,
      additional_specification: boq.additional_specification || "",
      description: entry.description || boq.description,
      unit: entry.unit || boq.unit,
      boq_quantity: boqQty,
      previous_quantity: prevQty,
      current_quantity: currentQty,
      total_quantity: totalQty,
      balance_quantity: balanceQty,
      rate: rate,
      previous_amount: previousAmount,
      amount: amount,
      cumulative_amount: cumulativeAmount
    });
  });

  grossAmount = round2(grossAmount);

  // Deductions calculation
  const gstRate = num(ratesAndDeductions.gst_rate ?? 18);
  const labourCessRate = num(ratesAndDeductions.labour_cess_rate ?? 1);
  const securityDepositRate = num(ratesAndDeductions.security_deposit_rate ?? 5);
  const otherDeductions = round2(num(ratesAndDeductions.other_deductions ?? 0));

  const gstAmount = round2((grossAmount * gstRate) / 100);
  const labourCessAmount = round2((grossAmount * labourCessRate) / 100);
  const securityDepositAmount = round2((grossAmount * securityDepositRate) / 100);

  const netPayable = round2(grossAmount + gstAmount - labourCessAmount - securityDepositAmount - otherDeductions);
  const amountInWords = numberToWords(netPayable);

  return {
    billItems,
    grossAmount,
    gstRate,
    gstAmount,
    labourCessRate,
    labourCessAmount,
    securityDepositRate,
    securityDepositAmount,
    otherDeductions,
    netPayable,
    amountInWords
  };
};

export default {
  numberToWords,
  calculateRaBill
};

