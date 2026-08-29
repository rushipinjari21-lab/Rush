/**
 * Frontend RA Bill Financial Engine
 * PCMC BillPro - Financial & Deduction Calculator for React UI
 */

const num = (val) => Number.parseFloat(val) || 0;
const round2 = (val) => Number(num(val).toFixed(2));

export const numberToWords = (amount) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const belowHundred = (n) => n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
  const belowThousand = (n) => n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${belowHundred(n % 100)}` : ""}` : belowHundred(n);

  const val = num(amount);
  const integer = Math.floor(Math.abs(val));
  const chunks = [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]];

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

export const calculateDeductions = (grossAmount = 0, rates = {}) => {
  const gross = num(grossAmount);
  const gstRate = num(rates.gst_rate ?? 18);
  const labourCessRate = num(rates.labour_cess_rate ?? 1);
  const securityDepositRate = num(rates.security_deposit_rate ?? 5);
  const otherDeductions = round2(num(rates.other_deductions ?? 0));

  const gstAmount = round2((gross * gstRate) / 100);
  const labourCessAmount = round2((gross * labourCessRate) / 100);
  const securityDepositAmount = round2((gross * securityDepositRate) / 100);

  const netPayable = round2(gross + gstAmount - labourCessAmount - securityDepositAmount - otherDeductions);
  const amountInWords = numberToWords(netPayable);

  return {
    grossAmount: round2(gross),
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
  calculateDeductions
};

