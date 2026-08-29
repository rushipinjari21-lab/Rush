/**
 * Page Break & Pagination Engine for Official Legal Municipal Documents
 * PCMC BillPro - Automated A4 (Portrait & Landscape) Layout & Table Chunking
 */

export const A4_PORTRAIT = {
  orientation: 'PORTRAIT',
  name: 'A4',
  width: 595.28,   // 210 mm
  height: 841.89,  // 297 mm
  marginTop: 42,    // ~15 mm
  marginBottom: 42, // ~15 mm
  marginLeft: 45,   // ~16 mm (left binding margin)
  marginRight: 45,  // ~16 mm
  tableWidth: 505.28, // Master Form Width
  headerHeight: 65,
  footerHeight: 35,
  signatureHeight: 95
};

export const LEGAL_PORTRAIT = {
  orientation: 'PORTRAIT',
  name: 'Legal',
  width: 612.0,    // 8.5 in (215.9 mm)
  height: 1008.0,  // 14.0 in (355.6 mm)
  marginTop: 42,
  marginBottom: 42,
  marginLeft: 53.36,  // Centered A4 master width (612 - 505.28)/2
  marginRight: 53.36,
  tableWidth: 505.28, // Master Form Width (Identical)
  headerHeight: 65,
  footerHeight: 35,
  signatureHeight: 95
};

export const resolvePaperDimensions = (paperSize = 'A4') => {
  const norm = String(paperSize || 'A4').trim().toLowerCase();
  if (norm === 'legal') {
    return LEGAL_PORTRAIT;
  }
  return A4_PORTRAIT;
};

export const A4_LANDSCAPE = {
  orientation: 'LANDSCAPE',
  name: 'A4_LANDSCAPE',
  width: 841.89,   // 297 mm
  height: 595.28,  // 210 mm
  marginTop: 40,    // ~14 mm
  marginBottom: 40, // ~14 mm
  marginLeft: 45,   // ~16 mm (left binding margin)
  marginRight: 40,  // ~14 mm
  headerHeight: 60,
  footerHeight: 35,
  signatureHeight: 90
};

export const PAGE_CONFIG = A4_PORTRAIT;

/**
 * Get available content height for a given orientation config
 */
export const getAvailableHeight = (config = A4_PORTRAIT) => {
  return config.height - config.marginTop - config.marginBottom - config.headerHeight - config.footerHeight;
};

/**
 * Estimate text height for table cells given column width
 */
export const estimateCellHeight = (text = "", colWidth = 100, fontSize = 8.5) => {
  const str = String(text || "");
  const linesCount = str.split("\n").length;
  const charsPerLine = Math.max(1, Math.floor(colWidth / (fontSize * 0.52)));
  const wrappedLines = Math.ceil(str.replace(/\n/g, " ").length / charsPerLine) || 1;
  const effectiveLines = Math.max(linesCount, wrappedLines);
  return Math.max(16, effectiveLines * (fontSize + 3.5) + 6);
};

/**
 * Estimate full table row height
 */
export const estimateRowHeight = (rowValues = [], colWidths = [], fontSize = 8.5) => {
  let maxHeight = 16;
  rowValues.forEach((val, idx) => {
    const width = colWidths[idx] || 100;
    const h = estimateCellHeight(val, width, fontSize);
    if (h > maxHeight) maxHeight = h;
  });
  return maxHeight;
};

/**
 * Chunk table rows into pages, repeating table headers on every page.
 * Strictly prevents row splitting, row clipping, and footer overlap.
 */
export const paginateTableRows = (rows = [], colWidths = [], headerRowHeight = 22, fontSize = 8.5, config = A4_PORTRAIT) => {
  const contentHeight = getAvailableHeight(config);
  const pages = [];
  let currentPageRows = [];
  let currentHeight = headerRowHeight;

  rows.forEach((row) => {
    const rowHeight = estimateRowHeight(row, colWidths, fontSize);

    // If row exceeds remaining space on the page, move the entire row to next page
    if (currentHeight + rowHeight > contentHeight && currentPageRows.length > 0) {
      pages.push(currentPageRows);
      currentPageRows = [row];
      currentHeight = headerRowHeight + rowHeight;
    } else {
      currentPageRows.push(row);
      currentHeight += rowHeight;
    }
  });

  if (currentPageRows.length > 0) {
    pages.push(currentPageRows);
  }

  return pages;
};

export default {
  A4_PORTRAIT,
  A4_LANDSCAPE,
  PAGE_CONFIG,
  getAvailableHeight,
  estimateCellHeight,
  estimateRowHeight,
  paginateTableRows
};
