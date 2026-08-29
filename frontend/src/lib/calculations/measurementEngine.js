/**
 * Frontend Measurement & Civil Engineering Calculation Engine
 * PCMC BillPro - Advanced Engineering Formulas for Civil Construction Billing
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
    // Safe evaluation using Function with basic arithmetic validation
    const fn = new Function(`return (${sanitized})`);
    const val = fn();
    return typeof val === 'number' && isFinite(val) ? val : fallback;
  } catch (err) {
    return Number(sanitized) || fallback;
  }
};

/**
 * Normalise BOQ unit string for formula classification
 * @param {string} unit 
 * @returns {string} '3D' | '2D' | '1D' | 'STEEL' | 'COUNT'
 */
export const getEngineeringUnitType = (unit = '') => {
  const u = String(unit || '').toLowerCase().replace(/[.\s]/g, '');
  if (/^(m3|m³|cum|cumetres?|cmt|cft)$/.test(u)) return '3D'; // Volume: Cum
  if (/^(m2|m²|sqm|sqmetres?|psm|ft2|in2|sft)$/.test(u)) return '2D'; // Area: Sqm
  if (/^(m|mtr|mtrs|metre|metres|meter|meters|rm|rmt)$/.test(u)) return '1D'; // Length: Rmt
  if (/^(kg|kgs|mt|ton|tons|tonne|tonnes)$/.test(u)) return 'STEEL'; // Weight: MT / Kg
  return 'COUNT'; // Count: Nos / Each / Job / Set / Test
};

/**
 * Calculate quantity using Civil Engineering Formulas
 * Supports:
 * - Rectangular (Nos × L × B × H)
 * - Circular / Cylinder (Nos × 0.7854 × D² × H)
 * - Trapezoidal / Canal (Nos × ((B1 + B2)/2) × H × L)
 * - Triangular Prism (Nos × 0.5 × B × H × L)
 * - Steel Bar Reinforcement (Nos × (D²/162) × L in Kg or MT)
 * - 2D Area (Nos × L × B or Nos × 0.7854 × D²)
 * - 1D Length (Nos × L)
 * - Count / Multiplier
 * 
 * @param {Object} dimensions
 * @param {string} [unit='']
 * @param {string} [shape='RECTANGULAR']
 * @returns {number}
 */
export const calculateMeasurementQuantity = (dimensions = {}, unit = '', shape = 'RECTANGULAR') => {
  const nos = evaluateEngineeringExpression(dimensions.quantity, 1);
  const l = evaluateEngineeringExpression(dimensions.length, 0);
  const b = evaluateEngineeringExpression(dimensions.breadth, 0);
  const h = evaluateEngineeringExpression(dimensions.height, 0);

  const unitType = getEngineeringUnitType(unit);
  let result = 0;

  if (shape === 'CIRCULAR') {
    // Diameter D = length or breadth, Height H = height or length
    const diameter = l || b || 0;
    const depth = h || (l !== diameter ? l : 1);
    if (unitType === '3D') {
      result = nos * (Math.PI / 4) * (diameter * diameter) * (depth || 1);
    } else if (unitType === '2D') {
      result = nos * (Math.PI / 4) * (diameter * diameter);
    } else {
      result = nos * (diameter || 1);
    }
  } else if (shape === 'TRAPEZOIDAL') {
    // B1 = length, B2 = breadth, Depth/Height = height, Length = 1 or custom
    const avgWidth = (l + b) / 2;
    result = nos * avgWidth * (h || 1);
  } else if (shape === 'TRIANGULAR') {
    // 0.5 × Base × Height × Length
    result = nos * 0.5 * (l || 1) * (b || 1) * (h || 1);
  } else if (shape === 'STEEL_WEIGHT' || unitType === 'STEEL') {
    // Steel reinforcement formula: D² / 162 (Kg per meter) × Length (m)
    // diameter D = breadth or height in mm, length L = length in meters
    const diaMm = b || h || 0;
    const lenM = l || 1;
    const kgPerMeter = diaMm > 0 ? (diaMm * diaMm) / 162 : 1;
    const totalKg = nos * kgPerMeter * lenM;
    const u = String(unit).toLowerCase();
    result = (/^(mt|ton|tons|tonne|tonnes)$/.test(u)) ? totalKg / 1000 : totalKg;
  } else if (unitType === '3D') {
    result = nos * (l || 1) * (b || 1) * (h || 1);
  } else if (unitType === '2D') {
    result = nos * (l || 1) * (b || 1);
  } else if (unitType === '1D') {
    result = nos * (l || 1);
  } else if (unitType === 'COUNT') {
    const hasDim = l !== 0 || b !== 0 || h !== 0;
    result = hasDim ? nos * (l || 1) * (b || 1) * (h || 1) : nos;
  } else {
    const hasDim = l !== 0 || b !== 0 || h !== 0;
    result = hasDim ? nos * (l || 1) * (b || 1) * (h || 1) : nos;
  }

  return Number(result.toFixed(4));
};

/**
 * Format measurement formula display text for PWD / PCMC Form 45
 * @param {Object} entry 
 * @returns {string} e.g. "1 × 10.50m × 2.00m × 0.15m" or "(-) 1 × 1.20m × 2.10m"
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

  if (l > 0) parts.push(`${l.toFixed(2)}m`);
  if (b > 0) parts.push(`${b.toFixed(2)}m`);
  if (h > 0) parts.push(`${h.toFixed(2)}m`);

  return parts.join(' × ');
};

export default {
  evaluateEngineeringExpression,
  getEngineeringUnitType,
  calculateMeasurementQuantity,
  formatMeasurementFormula
};
