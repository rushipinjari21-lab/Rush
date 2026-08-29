/**
 * Dakhala Template Registry & Data Mapping
 * PCMC BillPro - Official Certificate Templates
 */

export const DAKHALA_TEMPLATES = {
  FIRST_RA_CHECKLIST: {
    id: "FIRST_RA_CHECKLIST",
    name: "First RA Bill Checklist",
    marathiTitle: "प्रथम आर. ए. बिल तपासणी सूची (Checklist)",
    description: "Checklist for verification of documents for 1st Running Account Bill"
  },
  GENERAL_DAKHALA: {
    id: "GENERAL_DAKHALA",
    name: "General Dakhala",
    marathiTitle: "सामान्य दाखला (General Dakhala Certificate)",
    description: "General verification and measurement correctness certificate"
  },
  PAYMENT_SCHEDULE: {
    id: "PAYMENT_SCHEDULE",
    name: "Payment Schedule",
    marathiTitle: "रक्कम अदा करण्याचे वेळापत्रक (Payment Schedule)",
    description: "Breakup of bill amount, deductions, and net payable schedule"
  },
  SITE_NO_CHANGE: {
    id: "SITE_NO_CHANGE",
    name: "Site / No Change Certificate",
    marathiTitle: "स्थल बदल नसलेबाबत दाखला (Site/No Change Certificate)",
    description: "Certificate that work execution site remains as per approved technical sanction"
  },
  LABOUR_INSURANCE_LEGAL: {
    id: "LABOUR_INSURANCE_LEGAL",
    name: "Labour, Insurance & Legal Certificate",
    marathiTitle: "कामगार कायदा व विमा अनुपालन दाखला",
    description: "Certificate of compliance with Labour Laws, Insurance, and Statutory rules"
  },
  GIS_MAPPING: {
    id: "GIS_MAPPING",
    name: "GIS Mapping Dakhala",
    marathiTitle: "जी.आय.एस. मॅपिंग दाखला (GIS Mapping Certificate)",
    description: "Verification certificate of completed work location on PCMC GIS GIS portal"
  },
  QUANTITY_VARIATION: {
    id: "QUANTITY_VARIATION",
    name: "Quantity Variation Certificate",
    marathiTitle: "परिमाण फरक प्रमाणक (Quantity Variation Certificate)",
    description: "Statement and certificate comparing Schedule B BOQ quantities against actual measurements"
  },
  DEPUTY_ENGINEER_CERT: {
    id: "DEPUTY_ENGINEER_CERT",
    name: "Deputy Engineer Certificate",
    marathiTitle: "उपअभियंता प्रमाणपत्र (Deputy Engineer Certificate)",
    description: "Technical verification and inspection certificate by Deputy Engineer"
  },
  EXECUTIVE_ENGINEER_CERT: {
    id: "EXECUTIVE_ENGINEER_CERT",
    name: "Executive Engineer Certificate",
    marathiTitle: "कार्यकारी अभियंता प्रमाणपत्र (Executive Engineer Certificate)",
    description: "Executive approval and final measurement certificate by Executive Engineer"
  },
  WORK_COMPLETION_CERT: {
    id: "WORK_COMPLETION_CERT",
    name: "Work Completion Certificate",
    marathiTitle: "काम पूर्णत्व दाखला (Work Completion Certificate)",
    description: "Certificate issued upon completion of civil work as per agreement specifications"
  }
};

/**
 * Format project and certificate data into template render payload
 * 
 * @param {string} templateId 
 * @param {Object} project 
 * @param {Object} [mb] 
 * @param {Object} [raBill] 
 * @param {Array} [entries] 
 * @returns {Object}
 */
export const prepareDakhalaPayload = (templateId, project = {}, mb = null, raBill = null, entries = []) => {
  const template = DAKHALA_TEMPLATES[templateId] || DAKHALA_TEMPLATES.GENERAL_DAKHALA;

  const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
  const numStr = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return {
    templateId: template.id,
    title: template.name,
    marathiTitle: template.marathiTitle,
    description: template.description,
    generatedDate: new Date().toLocaleDateString("en-IN"),
    project: {
      sap_work_key: project.sap_work_key || "—",
      work_name: project.work_name || "—",
      contractor_name: project.contractor_name || "—",
      contractor_address: project.contractor_address || "—",
      work_order_no: project.work_order_no || "—",
      tender_no: project.tender_no || "—",
      department: project.department || "—",
      budget_head: project.budget_head || "—",
      estimated_cost: numStr(project.estimated_cost),
      start_date: dateStr(project.start_date),
      completion_date: dateStr(project.completion_date),
      engineer_name: project.engineer_name || "Junior Engineer",
      deputy_engineer: project.deputy_engineer || "Deputy Engineer",
      executive_engineer: project.executive_engineer || "Executive Engineer"
    },
    mb: mb ? {
      mb_number: mb.mb_number || "—",
      mb_date: dateStr(mb.mb_date),
      total_entries: entries.length
    } : null,
    raBill: raBill ? {
      bill_number: raBill.bill_number || "—",
      bill_date: dateStr(raBill.bill_date),
      gross_amount: numStr(raBill.gross_amount),
      gst_amount: numStr(raBill.gst_amount),
      labour_cess_amount: numStr(raBill.labour_cess_amount),
      security_deposit_amount: numStr(raBill.security_deposit_amount),
      other_deductions: numStr(raBill.other_deductions),
      net_payable: numStr(raBill.net_payable)
    } : null
  };
};

export default {
  DAKHALA_TEMPLATES,
  prepareDakhalaPayload
};

