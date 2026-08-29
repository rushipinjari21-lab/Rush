/**
 * PCMC Official R.A. Bill Dakhale (Certificates & Checklists) Master Engine
 * Exact content, A4 geometry, Devanagari typography, bold labels, sharp contrast,
 * accurate margins, line spacing, and official signature placement.
 * Master authority: Scanned PCMC reference document.
 */
import { createCanvas } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { A4_PORTRAIT } from "./pageBreakEngine.js";

const MARATHI_FONT_FAMILY = '"Nirmala UI", "Mangal", "Arial Unicode MS", "Noto Sans Devanagari", sans-serif';

const FONT_TITLE_LARGE = `bold 17px ${MARATHI_FONT_FAMILY}`;
const FONT_TITLE_MED = `bold 15px ${MARATHI_FONT_FAMILY}`;
const FONT_BODY = `10.5px ${MARATHI_FONT_FAMILY}`;
const FONT_BODY_BOLD = `bold 10.5px ${MARATHI_FONT_FAMILY}`;
const FONT_SMALL = `9.5px ${MARATHI_FONT_FAMILY}`;
const FONT_SMALL_BOLD = `bold 9.5px ${MARATHI_FONT_FAMILY}`;
const FONT_SIGNATURE = `bold 11px ${MARATHI_FONT_FAMILY}`;
const FONT_SIGNATURE_SUB = `10px ${MARATHI_FONT_FAMILY}`;

/**
 * Text wrapping helper that preserves words and accounts for max line width
 */
const wrapText = (ctx, text, maxWidth) => {
  const words = String(text || "").trim().split(/\s+/);
  const lines = [];
  let curLine = "";
  for (const w of words) {
    const test = curLine ? `${curLine} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && curLine) {
      lines.push(curLine);
      curLine = w;
    } else {
      curLine = test;
    }
  }
  if (curLine) lines.push(curLine);
  return lines.length > 0 ? lines : [""];
};

/**
 * Draw centered title with authentic government underline
 */
const drawTitle = (ctx, text, y, paperWidth = 595.28, isDouble = false) => {
  ctx.fillStyle = "#000000";
  ctx.font = isDouble ? FONT_TITLE_LARGE : FONT_TITLE_MED;
  ctx.textAlign = "center";
  ctx.fillText(text, paperWidth / 2, y);

  const tw = ctx.measureText(text).width;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#000000";

  ctx.beginPath();
  ctx.moveTo((paperWidth - tw) / 2 - 4, y + 5);
  ctx.lineTo((paperWidth + tw) / 2 + 4, y + 5);
  ctx.stroke();

  if (isDouble) {
    ctx.beginPath();
    ctx.moveTo((paperWidth - tw) / 2 - 4, y + 8);
    ctx.lineTo((paperWidth + tw) / 2 + 4, y + 8);
    ctx.stroke();
  }
};

/**
 * Draw an authentic signature block with prominent bold designation
 */
const drawSignature = (ctx, lines, x, y, align = "center") => {
  ctx.fillStyle = "#000000";
  ctx.textAlign = align;
  let curY = y;
  lines.forEach((line, idx) => {
    ctx.font = idx === 0 ? FONT_SIGNATURE : FONT_SIGNATURE_SUB;
    ctx.fillText(line, x, curY);
    curY += 15;
  });
};

/**
 * Create ultra-crisp A4 canvas (Scale 2.5 for 300 DPI laser print appearance)
 */
const createA4Canvas = (paperWidth = 595.28, paperHeight = 841.89) => {
  const scale = 2.5;
  const canvas = createCanvas(paperWidth * scale, paperHeight * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Pure White Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, paperWidth, paperHeight);

  // Default Drawing Settings
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  return { canvas, ctx };
};

/**
 * Format project context fields with authentic fallbacks
 */
const extractContext = (project = {}, bill = {}) => {
  const work = project.work_name || "प्रभाग क्र.०६ मध्ये अतिक्रमण कारवाई व मनपा कार्यक्रमाांसाठी यंत्रसामुग्री व मनुष्यबळ पुरविणे (सन २०२५-२६)";
  const contractor = project.contractor_name || "मे.अक्षय एंटरप्रायझेस";
  const tenderNo = project.tender_no || project.sap_work_key || "25/11/2025-26";
  const estimatedCost = Number(project.estimated_cost || 6000000).toLocaleString("en-IN");
  const tenderAmount = Number(project.contract_amount || project.estimated_cost || bill.gross_amount || 2205023).toLocaleString("en-IN");
  const billNumber = bill.bill_number ? `पहिले आर. ए. बिल` : "पहिले आर. ए. बिल";
  const billAmount = bill.gross_amount ? Number(bill.gross_amount).toLocaleString("en-IN") : "";
  const billDate = bill.bill_date ? new Date(bill.bill_date).toLocaleDateString("en-IN") : "/०७/२०२६";
  const tenderRate = project.tender_percentage ? `${Math.abs(project.tender_percentage)}% ${project.tender_percentage < 0 ? 'कमी' : 'जास्त'}` : "३४.१०% कमी";
  const duration = project.duration_months ? `${project.duration_months} महिने` : "१२ महिने";
  const adminApproval = project.admin_approval_no
    ? `र.रु.${estimatedCost}/- ${project.admin_approval_no}`
    : `र.रु.६०,००,०००/- मा.प्रशासक ठराव क्र.८९७, दि.०९/०५/२०२५`;
  const techSanction = project.tech_sanction_no
    ? `${project.tech_sanction_no}, र.रु.${tenderAmount}/-`
    : `क्र.काअ/ग-क्षे/स्था/तांमा/०६/२०२५-२६, दि.१८/०८/२०२५, र.रु.२२,०५,०२३/-`;
  const workShort = work.length > 80 ? `${work.slice(0, 80)}...` : work;

  return {
    work,
    contractor,
    tenderNo,
    estimatedCost,
    tenderAmount,
    billNumber,
    billAmount,
    billDate,
    tenderRate,
    duration,
    adminApproval,
    techSanction,
    workShort
  };
};

/**
 * PAGE 1: पहिले आर. ए. बिल (First R.A. Bill Checklist - 20 items)
 */
export const renderPage1 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Header Title
  drawTitle(ctx, "पहिले आर. ए. बिल", 58, 595.28, true);

  // 20 Numbered Fields matching scanned authority
  const items = [
    { label: "१)   कामाचे नाव –", val: data.work, boldVal: false },
    { label: "२)   ठेकेदाराचे नाव –", val: data.contractor, boldVal: false },
    { label: "३)   अंदाजपत्रकीय किंमत –", val: `रक्कम रुपये ${data.estimatedCost}/-`, boldVal: false },
    { label: "४)   टेंडरची रक्कम –", val: `रक्कम रुपये ${data.tenderAmount}/-`, boldVal: false },
    { label: "५)   कामाची प्रशासकीय मान्यता –", val: data.adminApproval, boldVal: false },
    { label: "६)   कामाला तांत्रिक मान्यता –", val: data.techSanction, boldVal: false },
    { label: "७)   जाहिरातीचे वर्तमानपत्र व दिनांक –", val: data.tenderNo, boldVal: false },
    { label: "८)   कामाची निविदा केव्हा मान्य झाली –", val: "दि.०९/०३/२०२६.", boldVal: false },
    { label: "९)   कामाचा आदेश दिलेला दिनांक –", val: "दि.२७/०३/२०२६.", boldVal: false },
    { label: "१०) कामाची मुदत –", val: `${data.duration} (दि.२६/०३/२०२७)`, boldVal: false },
    { label: "११) प्रत्यक्ष काम संपलेली तारिख –", val: "काम चालू आहे.", boldVal: false },
    { label: "१२) काम पुर्ण झाले असल्यास कामाचे माप उशिरा घेतले त्याचे कारण –", val: "नाही", boldVal: true },
    { label: "१३) मुदतवाढ दिली काय ? दिल्यास केव्ही दिली व किती दिली –", val: "", boldVal: false },
    { label: "१४) पहिले आर. ए. बिलाची रक्कम रुपये –", val: `र.रु. ${data.billAmount ? `${data.billAmount}/-` : "/-"}`, boldVal: false },
    { label: "१५) एस्टिमेट रिव्हाईज करणे जरुर आहे काय ? –", val: "नाही", boldVal: true },
    { label: "१६) जादा बाब मंजुर करुन घेतले काय ? –", val: "नाही", boldVal: true },
    { label: "१७) ठेकेदारास सिमेंट व इतर सामान एकूण किती दिली व त्याची वसुली कशी केली –", val: "ठेकेदार याने स्वतः व्यवस्था केली.", boldVal: true },
    { label: "१८) ठेकेदाराने पाणी वापरले काय व त्याचे पैसे भरले नसल्यास १/२ टक्के कापुन घेतले काय ? –", val: "ठेकेदार याने स्वतः व्यवस्था केली.", boldVal: true },
    { label: "१९) ठेकेदारास मशिनरी भाड्याने दिली काय ? –", val: "ठेकेदार याने स्वतः व्यवस्था केली", boldVal: true },
    { label: "२०) इतर –", val: "सदर बिलामधून रॉयल्टीपोटी र.रु. /- वजा करणेत यावी.", boldVal: true }
  ];

  let curY = 96;
  ctx.textAlign = "left";

  items.forEach((item) => {
    const fullText = item.val ? `${item.label} ${item.val}` : item.label;
    ctx.font = FONT_BODY;
    const lines = wrapText(ctx, fullText, 505);
    lines.forEach((l, idx) => {
      ctx.font = (idx === 0 && item.boldVal && item.val && l.includes(item.val)) ? FONT_BODY_BOLD : FONT_BODY;
      ctx.fillText(l, 45, curY);
      curY += 15.5;
    });
    curY += 1.2;
  });

  // Dual Signatures
  drawSignature(ctx, [
    "कनिष्ठ अभियंता",
    "पिंपरी चिंचवड महानगरपालिका,",
    "पिंपरी – ४११ ०१८."
  ], 145, 755, "center");

  drawSignature(ctx, [
    "उप अभियंता",
    "पिंपरी चिंचवड महानगरपालिका,",
    "पिंपरी – ४११ ०१८.."
  ], 445, 755, "center");

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 2: दाखला — उप अभियंता (100% Inspection)
 */
export const renderPage2 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Title
  drawTitle(ctx, "दाखला", 75, 595.28, false);

  const fields = [
    `१)   ठेकेदाराचे नाव – ${data.contractor}`,
    `२)   कामाचे नाव – ${data.work}`,
    `३)   प्रशासकीय मान्यता – रक्कम रुपये ${data.estimatedCost}/-`,
    `४)   निविदा रक्कम – रक्कम रुपये ${data.tenderAmount}/-`,
    `५)   निविदा क्रमांक – ${data.tenderNo}`,
    `६)   कामाचा दर – ${data.tenderRate}`,
    `७)   कामाची मुळ मुदत – ${data.duration}`,
    `८)   कामाचे बिल क्रमांक – ${data.billNumber}`
  ];

  let curY = 125;
  ctx.font = FONT_BODY;
  ctx.textAlign = "left";

  fields.forEach((f) => {
    const lines = wrapText(ctx, f, 505);
    lines.forEach((l) => {
      ctx.fillText(l, 45, curY);
      curY += 18;
    });
    curY += 6;
  });

  // Body Paragraph
  curY += 14;
  const paragraph = "प्रस्तुत कामाची मी श्री.वहिकर सुदर्शन श्रीनिवास, उप अभियंता विभाग स्थापत्य क क्षेत्रिय १००% तपासणी केली असुन सदरच्या कामाचे इस्टीमेट तयार करताना केलेल्या सार्वजनिक बांधकाम विभागाकडील मानांकनानुसार योग्य व समाधानकारक आहे.";
  const pLines = wrapText(ctx, paragraph, 505);
  pLines.forEach((pl) => {
    ctx.fillText(pl, 75, curY);
    curY += 19;
  });

  // Signature
  drawSignature(ctx, [
    "उप अभियंता",
    "स्थापत्य क क्षेत्रिय",
    "पिं.चिं.मनपा"
  ], 465, curY + 65, "right");

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 3: दाखला — कार्यकारी अभियंता (25% Inspection)
 */
export const renderPage3 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Title
  drawTitle(ctx, "दाखला", 75, 595.28, false);

  const fields = [
    `१)   ठेकेदाराचे नाव – ${data.contractor}`,
    `२)   कामाचे नाव – ${data.work}`,
    `३)   प्रशासकीय मान्यता – रक्कम रुपये ${data.estimatedCost}/-`,
    `४)   निविदा रक्कम – रक्कम रुपये ${data.tenderAmount}/-`,
    `५)   निविदा क्रमांक – ${data.tenderNo}`,
    `६)   कामाचा दर – ${data.tenderRate}`,
    `७)   कामाची मुळ मुदत – ${data.duration}`,
    `८)   कामाचे बिल क्रमांक – ${data.billNumber}`
  ];

  let curY = 125;
  ctx.font = FONT_BODY;
  ctx.textAlign = "left";

  fields.forEach((f) => {
    const lines = wrapText(ctx, f, 505);
    lines.forEach((l) => {
      ctx.fillText(l, 45, curY);
      curY += 18;
    });
    curY += 6;
  });

  // Body Paragraph
  curY += 14;
  const paragraph = "प्रस्तुत कामाची मी श्री.सुनीलदत्त लहानू नरोटे, कार्यकारी अभियंता विभाग स्थापत्य क क्षेत्रिय २५% तपासणी केली असुन सदरच्या कामाचे इस्टीमेट तयार करताना केलेल्या सार्वजनिक बांधकाम विभागाकडील मानांकनानुसार योग्य व समाधानकारक आहे.";
  const pLines = wrapText(ctx, paragraph, 505);
  pLines.forEach((pl) => {
    ctx.fillText(pl, 75, curY);
    curY += 19;
  });

  // Signature
  drawSignature(ctx, [
    "कार्यकारी अभियंता",
    "स्थापत्य क क्षेत्रिय",
    "पिं.चिं.मनपा"
  ], 465, curY + 65, "right");

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 4: Payment Schedule
 */
export const renderPage4 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Title
  drawTitle(ctx, "Payment Schedule", 75, 595.28, false);

  // Header Details
  ctx.font = FONT_BODY_BOLD;
  ctx.textAlign = "center";

  const workLines = wrapText(ctx, `कामाचे नाव – ${data.work}`, 480);
  let curY = 120;
  workLines.forEach((wl) => {
    ctx.fillText(wl, 595.28 / 2, curY);
    curY += 18;
  });

  curY += 6;
  ctx.fillText(`निविदा क्रमांक – ${data.tenderNo}`, 595.28 / 2, curY);

  // Bordered Table
  curY += 30;
  const tableX = 45;
  const tableW = 505.28;
  const rowH = 34;

  const colWidths = [45, 95, 85, 95, 185.28];
  const colX = [
    tableX,
    tableX + colWidths[0],
    tableX + colWidths[0] + colWidths[1],
    tableX + colWidths[0] + colWidths[1] + colWidths[2],
    tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    tableX + tableW
  ];

  // Table Header
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(tableX, curY, tableW, rowH);

  ctx.beginPath();
  for (let i = 1; i < colX.length - 1; i++) {
    ctx.moveTo(colX[i], curY);
    ctx.lineTo(colX[i], curY + rowH);
  }
  ctx.stroke();

  ctx.font = FONT_BODY_BOLD;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText("Sr. No.", colX[0] + colWidths[0] / 2, curY + 21);
  ctx.fillText("Bill No.", colX[1] + colWidths[1] / 2, curY + 21);
  ctx.fillText("Bill Date", colX[2] + colWidths[2] / 2, curY + 21);
  ctx.fillText("Bill Amount", colX[3] + colWidths[3] / 2, curY + 21);
  ctx.fillText("Remark", colX[4] + colWidths[4] / 2, curY + 21);

  // Table Data Row
  curY += rowH;
  const dataRowH = 55;
  ctx.strokeRect(tableX, curY, tableW, dataRowH);

  ctx.beginPath();
  for (let i = 1; i < colX.length - 1; i++) {
    ctx.moveTo(colX[i], curY);
    ctx.lineTo(colX[i], curY + dataRowH);
  }
  ctx.stroke();

  ctx.font = FONT_BODY;
  ctx.textAlign = "center";
  ctx.fillText("1", colX[0] + colWidths[0] / 2, curY + 28);
  ctx.fillText("1'st R. A. Bill", colX[1] + colWidths[1] / 2, curY + 28);
  ctx.fillText(data.billDate, colX[2] + colWidths[2] / 2, curY + 28);
  ctx.fillText(data.billAmount || "-", colX[3] + colWidths[3] / 2, curY + 28);

  ctx.textAlign = "left";
  const remarkLines = wrapText(ctx, "उपलब्ध तरतुदीप्रमाणे पहिले रनिंग देयक अदा करणेत येत आहे", colWidths[4] - 12);
  let rY = curY + 20;
  remarkLines.forEach((rl) => {
    ctx.fillText(rl, colX[4] + 8, rY);
    rY += 16;
  });

  // Signature
  drawSignature(ctx, [
    "कार्यकारी अभियंता",
    "स्थापत्य क क्षेत्रिय",
    "पिंपरी चिंचवड महानगरपालिका,",
    "पिंपरी, पुणे-१८"
  ], 465, curY + dataRowH + 60, "right");

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 5: दाखला — Site / Location Certificate
 */
export const renderPage5 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Title
  drawTitle(ctx, "दाखला", 75, 595.28, false);

  const fields = [
    `१)   ठेकेदाराचे नाव – ${data.contractor}`,
    `२)   कामाचे नाव – ${data.work}`,
    `३)   निविदा रक्कम – रक्कम रुपये ${data.tenderAmount}/-`,
    `४)   निविदा क्रमांक – ${data.tenderNo}`
  ];

  let curY = 125;
  ctx.font = FONT_BODY;
  ctx.textAlign = "left";

  fields.forEach((f) => {
    const lines = wrapText(ctx, f, 505);
    lines.forEach((l) => {
      ctx.fillText(l, 45, curY);
      curY += 18;
    });
    curY += 8;
  });

  // Body Paragraph
  curY += 18;
  const paragraph = "प्रस्तुत काम अंदाजपत्रकानुसार त्याच जागेवर पुर्ण करणेत आलेले असून कोणताही स्थळ बदल करणेत आलेला नाही.";
  const pLines = wrapText(ctx, paragraph, 505);
  pLines.forEach((pl) => {
    ctx.fillText(pl, 75, curY);
    curY += 20;
  });

  // Dual Signatures
  curY += 75;
  drawSignature(ctx, [
    "कनिष्ठ अभियंता",
    "स्थापत्य क क्षेत्रिय"
  ], 95, curY, "left");

  drawSignature(ctx, [
    "उप अभियंता",
    "स्थापत्य क क्षेत्रिय"
  ], 465, curY + 45, "right");

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 6: कंत्राटी कामगार / कायदेशीर अनुपालन दाखला
 */
export const renderPage6 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Top Header (Right Aligned)
  ctx.font = FONT_BODY_BOLD;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "right";
  ctx.fillText("पिंपरी चिंचवड महानगरपालिका,", 550, 55);
  ctx.fillText("क क्षेत्रीय कार्यालय, स्थापत्य विभाग", 550, 72);
  ctx.font = FONT_BODY;
  ctx.fillText("जा.क्र.कक्षे/स्था/काकवि/        /२०२६", 550, 90);
  ctx.fillText("दिनांक -     /     /२०२६", 550, 107);

  // Title
  drawTitle(ctx, "दाखला", 155, 595.28, false);

  // Fields
  let curY = 195;
  ctx.font = FONT_BODY;
  ctx.textAlign = "left";

  const fields = [
    `कामाचे नाव – ${data.work}`,
    `निविदा क्रमांक – ${data.tenderNo}`,
    `ठेकेदाराचे नाव – ${data.contractor}`
  ];

  fields.forEach((f) => {
    const lines = wrapText(ctx, f, 505);
    lines.forEach((l) => {
      ctx.fillText(l, 45, curY);
      curY += 18;
    });
    curY += 8;
  });

  // Paragraph 1
  curY += 12;
  const p1 = `वरील कामकाजाबाबत ठेकेदार ${data.contractor} यांनी प्रकरणी कंत्राटी कामगार (नियमन व निर्मूलन) अधिनियम, १९७० मधील तरतूदींचे पालन केले आहे. तसेच किमान वेतन कायदा १९४८, कर्मचारी राज्य विमा कायदा १९४८, भविष्य निर्वाह निधी कायदा १९५२ इत्यादी कायदेशीर बाबींचे काटेकोरपणे पालन केले आहे. कंत्राटदाराने कामाचा व त्यावर काम करणा-या कामगारांचा विमा नॅशनल इंन्शुरन्स कं. लि., चिंचवड यांच्याकडे उतरवला आहे.`;
  const p1Lines = wrapText(ctx, p1, 505);
  p1Lines.forEach((pl) => {
    ctx.fillText(pl, 75, curY);
    curY += 18;
  });

  // Supervisory Section
  curY += 28;
  ctx.fillText("पर्यवेक्षकीय अधिकारी –", 320, curY);
  curY += 18;
  ctx.fillText("स्वाक्षरी –", 320, curY);
  curY += 18;
  ctx.fillText("पदनाम –", 320, curY);

  // Recommendation
  curY += 35;
  ctx.font = FONT_BODY_BOLD;
  ctx.fillText("बिल देण्यास शिफारस आहे / नाही.", 45, curY);

  // Officer Section
  curY += 35;
  ctx.font = FONT_BODY;
  ctx.fillText("विभागप्रमुख / प्राधिकृत सक्षम अधिकारी", 320, curY);
  curY += 18;
  ctx.fillText("स्वाक्षरी –", 320, curY);
  curY += 18;
  ctx.fillText("पदनाम –", 320, curY);

  // Note
  curY += 38;
  ctx.font = FONT_SMALL;
  const note = "टिप – सदरचा दाखला संबंधित ठेकेदाराचे बिल अदा करताना प्रकरणी समाविष्ट करणे बंधनकारक आहे.";
  const noteLines = wrapText(ctx, note, 505);
  noteLines.forEach((nl) => {
    ctx.fillText(nl, 45, curY);
    curY += 15;
  });

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 7: GIS Mapping दाखला
 */
export const renderPage7 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Header Title
  ctx.font = FONT_BODY_BOLD;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText("पिंपरी चिंचवड महानगरपालिका, पिंपरी – ४११ ०१८", 595.28 / 2, 65);

  drawTitle(ctx, "GIS Mapping दाखला", 100, 595.28, false);

  // Fields
  let curY = 150;
  ctx.font = FONT_BODY;
  ctx.textAlign = "left";

  const fields = [
    `१)   कामाचे नाव – ${data.work}`,
    `२)   निविदा क्रमांक – ${data.tenderNo}`
  ];

  fields.forEach((f) => {
    const lines = wrapText(ctx, f, 505);
    lines.forEach((l) => {
      ctx.fillText(l, 45, curY);
      curY += 18;
    });
    curY += 10;
  });

  // Statement
  curY += 20;
  const statement = "सदर कामाअंतर्गत केलेल्या कामाची GIS Mapping नोंद घेण्यात आलेली असून, सदर कामाची बिल अदायगी करणेत यावी.";
  const sLines = wrapText(ctx, statement, 505);
  sLines.forEach((sl) => {
    ctx.fillText(sl, 75, curY);
    curY += 20;
  });

  // Signature
  drawSignature(ctx, [
    "कार्यकारी अभियंता (स्था)",
    "क क्षेत्रीय कार्यालय",
    "पिंपरी चिंचवड महानगरपालिका,",
    "पिंपरी – ४११ ०१८"
  ], 465, curY + 80, "right");

  return canvas.toBuffer("image/png");
};

/**
 * PAGE 8: कार्यालयीन टिपणी (Office Note & Quantity Variation submission)
 */
export const renderPage8 = async (ctxData, project, bill) => {
  const { canvas, ctx } = createA4Canvas(595.28, 841.89);
  const data = extractContext(project, bill);

  // Top Header
  ctx.font = FONT_BODY_BOLD;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.fillText("कार्यालयीन टिपणी", 45, 60);

  const tw = ctx.measureText("कार्यालयीन टिपणी").width;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(45, 64);
  ctx.lineTo(45 + tw, 64);
  ctx.stroke();

  ctx.textAlign = "right";
  ctx.fillText("क क्षेत्रीय, स्थापत्य विभाग", 550, 60);
  ctx.font = FONT_BODY;
  ctx.fillText("दिनांक -     /०७/२०२६", 550, 78);

  // Subject
  let curY = 118;
  ctx.font = FONT_BODY_BOLD;
  ctx.textAlign = "left";

  const subLines = wrapText(ctx, `विषय - ${data.work}.`, 420);
  subLines.forEach((sl) => {
    ctx.fillText(sl, 120, curY);
    curY += 18;
  });

  curY += 4;
  ctx.fillText(`निविदा नोटीस क्र.${data.tenderNo}`, 120, curY);

  // Salutation
  curY += 28;
  ctx.font = FONT_BODY_BOLD;
  ctx.fillText("मा.स.सादर,", 45, curY);

  // Paragraph 1
  curY += 20;
  ctx.font = FONT_BODY;
  const p1 = `उपरोक्त विषयांकीत कामाचा आदेश ठेकेदार ${data.contractor} यांना दि.२७/०३/२०२६ रोजी देणेत आला असून कामाचा स्विकृत निविदा दर ${data.tenderRate} इतका आहे. त्यानुसार ${data.workShort}, तसेच आवश्यकतेनुसार इतर अनुषंगिक कामे करणे गरजेचे आहे. परंतु सदर कामे केल्यास मुळ निविदेतील काही बाबींच्या परिमाणात वाढ होणार आहे. सदर बाबींमुळे मुळ निविदा रक्कम बदलत नसून उर्वरित बाबींच्या बचतीमधून सदर वाढीव परिमाणाचा काम करता येणार आहे.`;
  const p1Lines = wrapText(ctx, p1, 505);
  p1Lines.forEach((pl) => {
    ctx.fillText(pl, 75, curY);
    curY += 17;
  });

  // Paragraph 2
  curY += 14;
  const p2 = "तथापि मा.शहर अभियंता, पिंपरी चिंचवड महानगरपालिका यांचेकडील परिपत्रक क्र.स्थापत्य/शअ/तां/४/५४/२०२१, दि.२७/१/२०२१ अन्वये ३०% व त्यापेक्षा कमी निविदादर असलेल्या विकास कामांना Quantity Variation होत असलेक मा.शहर अभियंता / मा.सह शहर अभियंता यांची पुर्व परवानगी घेऊन काम करणेबाबत सुचित केले आहे. त्यानुसार विषयांकीत कामाचे मुळ निविदेत नमुद परिमाणापेक्षा जास्तीचे परिमाणाचे काम करणे गरजेचे असलेने त्यास मा.शहर अभियंता / मा.सह शहर अभियंता, पिं.चिं.मनपा यांची मान्यता आवश्यक आहे.";
  const p2Lines = wrapText(ctx, p2, 505);
  p2Lines.forEach((pl) => {
    ctx.fillText(pl, 75, curY);
    curY += 17;
  });

  // Submission
  curY += 14;
  const submission = "तरी सोबत जोडलेल्या Quantity Variation Sheet प्रमाणे सुधारीत परिमाणास मान्यता घेणेकामी स्वाक्षरीस्तव सविनय सादर.";
  const submLines = wrapText(ctx, submission, 505);
  submLines.forEach((sml) => {
    ctx.fillText(sml, 75, curY);
    curY += 17;
  });

  // Three Hierarchical Signatures
  curY += 45;
  drawSignature(ctx, [
    "उप अभियंता (स्था)",
    "क क्षेत्रीय कार्यालय",
    "पिं.चिं.महानगरपालिका"
  ], 110, curY, "center");

  curY += 55;
  drawSignature(ctx, [
    "कार्यकारी अभियंता (स्था)",
    "क क्षेत्रीय कार्यालय",
    "पिं.चिं.महानगरपालिका"
  ], 290, curY, "center");

  curY += 55;
  drawSignature(ctx, [
    "सह शहर अभियंता",
    "पिंपरी चिंचवड महानगरपालिका,",
    "पिंपरी-४११ ०१८"
  ], 450, curY, "center");

  return canvas.toBuffer("image/png");
};

/**
 * Generate Complete 8-Page Official PCMC Dakhale PDF Document
 */
export const generatePcmcDakhalePdf = async ({ project = {}, bill = {}, templateKey = "FIRST_RA_CHECKLIST" }) => {
  const pdfDoc = await PDFDocument.create();
  const w = A4_PORTRAIT.width;
  const h = A4_PORTRAIT.height;

  const renderers = [
    { key: "PAGE_1", fn: renderPage1 },
    { key: "PAGE_2", fn: renderPage2 },
    { key: "PAGE_3", fn: renderPage3 },
    { key: "PAGE_4", fn: renderPage4 },
    { key: "PAGE_5", fn: renderPage5 },
    { key: "PAGE_6", fn: renderPage6 },
    { key: "PAGE_7", fn: renderPage7 },
    { key: "PAGE_8", fn: renderPage8 }
  ];

  const targetRenderers = templateKey === "FIRST_RA_CHECKLIST" || templateKey === "ALL_DAKHALE"
    ? renderers
    : templateKey === "SUB_DIV_ENGINEER_DAKHALA" || templateKey === "DEPUTY_ENGINEER_CERT" || templateKey === "GENERAL_DAKHALA"
      ? [renderers[1]]
      : templateKey === "EXECUTIVE_ENGINEER_DAKHALA" || templateKey === "EXECUTIVE_ENGINEER_CERT"
        ? [renderers[2]]
        : templateKey === "PAYMENT_SCHEDULE"
          ? [renderers[3]]
          : templateKey === "SITE_NO_CHANGE"
            ? [renderers[4]]
            : templateKey === "LABOUR_INSURANCE_LEGAL"
              ? [renderers[5]]
              : templateKey === "GIS_MAPPING"
                ? [renderers[6]]
                : templateKey === "QUANTITY_VARIATION" || templateKey === "OFFICE_NOTE"
                  ? [renderers[7]]
                  : [renderers[0]];

  for (const item of targetRenderers) {
    const pngBuf = await item.fn({}, project, bill);
    const pngImg = await pdfDoc.embedPng(pngBuf);
    const page = pdfDoc.addPage([w, h]);
    page.drawImage(pngImg, { x: 0, y: 0, width: w, height: h });
  }

  return pdfDoc.save();
};

export default {
  renderPage1,
  renderPage2,
  renderPage3,
  renderPage4,
  renderPage5,
  renderPage6,
  renderPage7,
  renderPage8,
  generatePcmcDakhalePdf
};
