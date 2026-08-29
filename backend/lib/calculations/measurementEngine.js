/**
 * Backend Measurement & Civil Engineering Calculation Engine
 * PCMC BillPro - Advanced Engineering Formulas for Civil Work Billing
 */

/**
 * Safely evaluate math expression strings entered by engineers
 * e.g. "12.5 + 3.2", "2 * (3.5 + 1.2)", "10.5 / 2"
 * @param {string|number} expr 
 * @param {number} fallback 
 * @returns {number}
 */
export const evaluateEngineeringExpression = (expr, fallback = 0) => {
  if (expr === undefined || expr === null || expr === '') return fallback;
  if (typeof expr === 'number') return isNaN(expr) ? fallback : expr;

  const sanitized = String(expr).trim().replace(/[^\d.+\-*/()]/g, '');
  if (!sanitized) return fallback;

  try {
    const fn = new Function(`return (${sanitized})`);
    const val = fn();
    return typeof val === 'number' && isFinite(val) ? val : fallback;
  } catch (err) {
    return Number(sanitized) || fallback;
  }
};

/**
 * Normalise unit string for formula selection
 * @param {string} unit 
 * @returns {string}
 */
export const normalizeUnit = (unit) => {
  const u = String(unit || "").toLowerCase().trim().replace(/[.\s]/g, "");
  if (/^(m3|m³|cum|cumetres?|cmt|cft)$/.test(u)) return "Cum";
  if (/^(m2|m²|sqm|sqmetres?|psm|ft2|in2|sft)$/.test(u)) return "Sqm";
  if (/^(m|mtr|mtrs|metre|metres|meter|meters|rm|rmt)$/.test(u)) return "Mtr";
  if (/^(kg|kgs|mt|ton|tons|tonne|tonnes)$/.test(u)) return "Steel";
  if (/^(nos?|each|set|job|bag|bags|test|tests|day|days|hr|hrs|hours?)$/.test(u)) return "Nos";
  return "General";
};

/**
 * Calculate quantity using Civil Engineering Formulas
 * @param {Object} dimensions
 * @param {string} [unit=""]
 * @param {string} [shape="RECTANGULAR"]
 * @returns {number} calculated total quantity rounded to 4 decimal places
 */
export const calculateMeasurementQuantity = (dimensions = {}, unit = "", shape = "RECTANGULAR") => {
  const nos = evaluateEngineeringExpression(dimensions.quantity, 1);
  const l = evaluateEngineeringExpression(dimensions.length, 0);
  const b = evaluateEngineeringExpression(dimensions.breadth, 0);
  const h = evaluateEngineeringExpression(dimensions.height, 0);

  const unitType = normalizeUnit(unit);
  let result = 0;

  if (shape === 'CIRCULAR') {
    const diameter = l || b || 0;
    const depth = h || (l !== diameter ? l : 1);
    if (unitType === 'Cum') {
      result = nos * (Math.PI / 4) * (diameter * diameter) * (depth || 1);
    } else if (unitType === 'Sqm') {
      result = nos * (Math.PI / 4) * (diameter * diameter);
    } else {
      result = nos * (diameter || 1);
    }
  } else if (shape === 'TRAPEZOIDAL') {
    const avgWidth = (l + b) / 2;
    result = nos * avgWidth * (h || 1);
  } else if (shape === 'TRIANGULAR') {
    result = nos * 0.5 * (l || 1) * (b || 1) * (h || 1);
  } else if (shape === 'STEEL_WEIGHT' || unitType === 'Steel') {
    const diaMm = b || h || 0;
    const lenM = l || 1;
    const kgPerMeter = diaMm > 0 ? (diaMm * diaMm) / 162 : 1;
    const totalKg = nos * kgPerMeter * lenM;
    const u = String(unit).toLowerCase();
    result = (/^(mt|ton|tons|tonne|tonnes)$/.test(u)) ? totalKg / 1000 : totalKg;
  } else if (unitType === "Nos") {
    if (l === 0 && b === 0 && h === 0) {
      result = nos;
    } else {
      const factorL = l !== 0 ? l : 1;
      const factorB = b !== 0 ? b : 1;
      const factorH = h !== 0 ? h : 1;
      result = nos * factorL * factorB * factorH;
    }
  } else if (unitType === "Mtr") {
    const factorL = l !== 0 ? l : 1;
    result = nos * factorL;
  } else if (unitType === "Sqm") {
    const factorL = l !== 0 ? l : 1;
    const factorB = b !== 0 ? b : 1;
    result = nos * factorL * factorB;
  } else if (unitType === "Cum") {
    const factorL = l !== 0 ? l : 1;
    const factorB = b !== 0 ? b : 1;
    const factorH = h !== 0 ? h : 1;
    result = nos * factorL * factorB * factorH;
  } else {
    const hasDimensions = l !== 0 || b !== 0 || h !== 0;
    if (!hasDimensions) {
      result = nos;
    } else {
      const factorL = l !== 0 ? l : 1;
      const factorB = b !== 0 ? b : 1;
      const factorH = h !== 0 ? h : 1;
      result = nos * factorL * factorB * factorH;
    }
  }

  return Number(result.toFixed(4));
};

/**
 * Format measurement formula display text for MB screens and reports
 * @param {Object} entry 
 * @returns {string} e.g. "1 × 10.50 × 2.00 × 0.15" or "(-) 1 × 5.00"
 */
export const formatMeasurementFormula = (entry = {}) => {
  const qtyVal = Number(entry.quantity) || 1;
  const isDeduct = qtyVal < 0 || Number(entry.total_quantity) < 0;
  const nos = Math.abs(qtyVal);
  const l = Number(entry.length) || 0;
  const b = Number(entry.breadth) || 0;
  const h = Number(entry.height) || 0;

  const parts = [];
  if (isDeduct) parts.push(`(-) ${nos}`);
  else parts.push(`${nos}`);

  if (l > 0) parts.push(l.toFixed(2));
  if (b > 0) parts.push(b.toFixed(2));
  if (h > 0) parts.push(h.toFixed(2));

  return parts.join(" × ");
};

export default {
  evaluateEngineeringExpression,
  normalizeUnit,
  calculateMeasurementQuantity,
  formatMeasurementFormula
};
