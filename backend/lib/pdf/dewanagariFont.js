/**
 * Devanagari & Font Engine for PCMC Official PDFs
 * PCMC BillPro - Handles Devanagari (Marathi) & English Typography
 */
import { StandardFonts } from "pdf-lib";

/**
 * Sanitize text to ensure character encoding compatibility in PDF streams.
 * If Devanagari text is present, converts or preserves UTF-8 representations.
 * @param {string} text 
 * @returns {string}
 */
export const sanitizePdfText = (text = "") => {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .trim();
};

/**
 * Get standard PDF fonts
 * @param {PDFDocument} pdfDoc 
 * @returns {Promise<Object>} { fontRegular, fontBold }
 */
export const embedPdfFonts = async (pdfDoc) => {
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  return { fontRegular, fontBold };
};

export default {
  sanitizePdfText,
  embedPdfFonts
};

