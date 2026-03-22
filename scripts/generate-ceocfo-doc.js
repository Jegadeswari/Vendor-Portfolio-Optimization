// ============================================================================
// generate-ceocfo-doc.js
// ----------------------------------------------------------------------------
// Reads the CEO/CFO memo from cell A3 of CEOCFO Recommendations sheet.
// The memo is written as a single string with \n line breaks by Step 12.
// Parses it into sections and generates a formatted Word document.
//
// Usage:
//   node scripts/generate-ceocfo-doc.js <workbook.xlsx> <output.docx>
//
// Prerequisites:
//   npm install docx xlsx
// ============================================================================

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, Header, Footer
} = require("docx");

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const workbookPath = process.argv[2];
const outputPath = process.argv[3];

if (!workbookPath || !outputPath) {
  console.error("Usage: node generate-ceocfo-doc.js <workbook.xlsx> <output.docx>");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read memo from workbook
// ---------------------------------------------------------------------------

const wb = XLSX.readFile(workbookPath);
const wsCeo = wb.Sheets["CEOCFO Recommendations"];
const wsOpp = wb.Sheets["Top 3 Opportunities"];

// Try A3 first (single string format from new Step 12 prompt)
// Fall back to multi-row format from old Step 12 prompt
const a3Cell = wsCeo["A3"];
const a3Value = a3Cell ? String(a3Cell.v || "").trim() : "";

let lines = [];

if (a3Value.length > 100) {
  // New format: full memo as single string in A3 with \n separators
  lines = a3Value.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  console.log(`Reading memo from A3 — ${lines.length} lines, ${a3Value.length} chars`);
} else {
  // Legacy format: memo spread across multiple rows from A3 downward
  const rawRows = XLSX.utils.sheet_to_json(wsCeo, { header: 1 });
  lines = rawRows
    .slice(2)
    .map(row => row[0] ? String(row[0]).trim() : "")
    .filter(l => l.length > 0 && !/^[─\-]{5,}$/.test(l));
  console.log(`Reading memo from rows — ${lines.length} lines (legacy format)`);
}

if (!lines.length) {
  console.error("ERROR: No memo content found in CEOCFO Recommendations sheet.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read Top 3 Opportunities from dedicated sheet
// ---------------------------------------------------------------------------

const oppRaw = XLSX.utils.sheet_to_json(wsOpp, { header: 1 });
const opportunities = oppRaw.slice(1, 4).map(row => ({
  title: String(row[1] || "").trim(),
  explanation: String(row[2] || "").trim(),
  savings: row[3] ? `$${Number(row[3]).toLocaleString()}` : ""
})).filter(o => o.title);

// ---------------------------------------------------------------------------
// Parse lines into sections
// ---------------------------------------------------------------------------

const SECTION_PATTERNS = [
  { key: "header", test: l => /^(MEMORANDUM|TO[\s:]+|FROM[\s:]+|DATE[\s:]+|RE[\s:]+)/i.test(l) },
  { key: "overview", test: l => /^(1[\.\)]\s*)?(VENDOR SPEND OVERVIEW)/i.test(l) },
  { key: "drivers", test: l => /^(2[\.\)]\s*)?(MAJOR COST DRIVERS)/i.test(l) },
  { key: "top3", test: l => /^(3[\.\)]\s*)?(TOP 3 OPPORTUNITIES)/i.test(l) },
  { key: "savings", test: l => /^(4[\.\)]\s*)?(ESTIMATED SAVINGS)/i.test(l) },
  { key: "roadmap", test: l => /^(5[\.\)]\s*)?(IMPLEMENTATION ROADMAP)/i.test(l) },
  { key: "risks", test: l => /^(6[\.\)]\s*)?(RISKS)/i.test(l) },
  { key: "nextstep", test: l => /^(Recommended next step|Approvals|Next step)/i.test(l) }
];

const sections = {
  header: [], overview: [], drivers: [],
  top3: [], savings: [], roadmap: [],
  risks: [], nextstep: []
};

let current = "header";
for (const line of lines) {
  const match = SECTION_PATTERNS.find(p => p.test(line));
  if (match) current = match.key;
  sections[current].push(line);
}

// Strip section heading from body (first line if it looks like a heading)
const bodyLines = (key) => {
  const arr = sections[key];
  if (!arr.length) return [];
  // Strip first line if it looks like a section heading — with or without trailing text
  if (/^(\d+[\.\)]\s*)?[A-Z][A-Z\s]+(.*)?$/.test(arr[0]) && arr[0].length < 120) return arr.slice(1);
  return arr;
};

// Extract TO/FROM/DATE/RE from header section
const headerFields = { to: "", from: "", date: "", re: "" };
for (const line of sections.header) {
  const m = line.match(/^(TO|FROM|DATE|RE)\s*[:\-]\s*(.+)$/i);
  if (m) headerFields[m[1].toLowerCase()] = m[2].trim();
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const FONT = "Arial";
const BODY_SIZE = 20;   // 10pt
const NAVY = "1F3864";

const noBorder = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }
};

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = {
  top: cellBorder, bottom: cellBorder,
  left: cellBorder, right: cellBorder
};

// Auto-detect bullet lines
const para = (text, opts = {}) => {
  const isBullet = /^\s*[•·\-]\s/.test(text);
  const clean = text.replace(/^\s*[•·\-]\s*/, "").trim();
  if (isBullet) {
    return new Paragraph({
      children: [new TextRun({ text: clean, font: FONT, size: BODY_SIZE, ...opts })],
      bullet: { level: 0 },
      spacing: { after: 80 }
    });
  }
  return new Paragraph({
    children: [new TextRun({ text: text.trim(), font: FONT, size: BODY_SIZE, ...opts })],
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED
  });
};

const sectionHeading = (text) => new Paragraph({
  children: [new TextRun({
    text: text.replace(/^\d+[\.\)]\s*/, "").trim().toUpperCase(),
    font: FONT, size: 22, bold: true, color: NAVY
  })],
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 1 } },
  spacing: { before: 160, after: 80 }
});

const headerRow = (label, value) => new TableRow({
  children: [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: label, font: FONT, size: BODY_SIZE, bold: true, color: NAVY })] })],
      borders: noBorder, width: { size: 1200, type: WidthType.DXA }
    }),
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: value, font: FONT, size: BODY_SIZE })] })],
      borders: noBorder, width: { size: 8160, type: WidthType.DXA }
    })
  ]
});

// ---------------------------------------------------------------------------
// Build document children
// ---------------------------------------------------------------------------

const children = [];

// Title
children.push(new Paragraph({
  children: [new TextRun({ text: "MEMORANDUM", font: FONT, size: 40, bold: true, color: NAVY })],
  spacing: { after: 120 }
}));

// TO/FROM/DATE/RE table
const hRows = [];
if (headerFields.to) hRows.push(headerRow("TO", headerFields.to));
if (headerFields.from) hRows.push(headerRow("FROM", headerFields.from));
if (headerFields.date) hRows.push(headerRow("DATE", headerFields.date));
if (headerFields.re) hRows.push(headerRow("RE", headerFields.re));

if (hRows.length) {
  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, 8160],
    rows: hRows
  }));
}

// Thick navy divider
children.push(new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: NAVY, space: 1 } },
  spacing: { before: 80, after: 140 },
  children: []
}));

// Section helper
const addSection = (key, customHeading) => {
  const arr = sections[key];
  if (!arr.length) return;
  const heading = customHeading || arr[0];
  children.push(sectionHeading(heading));
  bodyLines(key).filter(l => l).forEach(l => children.push(para(l)));
};

// Section 1 — Vendor Spend Overview
addSection("overview");

// Section 2 — Major Cost Drivers
addSection("drivers");

// Section 3 — Top 3 Opportunities (plain text from A3 only — no table)
addSection("top3");

// Section 4 — Estimated Savings Summary
addSection("savings");

// Section 5 — Implementation Roadmap
addSection("roadmap");

// Section 6 — Risks
addSection("risks");

// Recommended next step
if (sections.nextstep.length) {
  children.push(new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
    spacing: { before: 120, after: 60 },
    children: []
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "RECOMMENDED NEXT STEP", font: FONT, size: BODY_SIZE, bold: true, color: NAVY })],
    spacing: { after: 40 }
  }));
  sections.nextstep.filter(l => l).forEach(l => {
    const clean = l.replace(/^Recommended next step\s*[:\-]\s*/i, "").trim();
    children.push(para(clean));
  });
}

// ---------------------------------------------------------------------------
// Assemble and write document
// ---------------------------------------------------------------------------

const today = new Date().toLocaleDateString("en-GB",
  { day: "numeric", month: "long", year: "numeric" });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 720, right: 900, bottom: 720, left: 900 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "CONFIDENTIAL", font: FONT, size: 16, bold: true, color: "C00000" }),
            new TextRun({ text: "  \u00b7  Vendor Spend Strategy Assessment  \u00b7  For CEO and CFO Only", font: FONT, size: 16, color: "888888" })
          ],
          alignment: AlignmentType.LEFT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } }
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: `Vendor Spend Strategy Assessment  \u00b7  ${today}  \u00b7  Page `, font: FONT, size: 16, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "888888" }),
            new TextRun({ text: " of ", font: FONT, size: 16, color: "888888" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "888888" })
          ],
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } }
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("CEOCFORecommendations.docx written to:", outputPath);
  console.log("Opportunities in table:", opportunities.length);
  console.log("Memo sections parsed:", Object.keys(sections).filter(k => sections[k].length > 0).join(", "));
}).catch(err => {
  console.error("Failed to generate Word document:", err.message);
  process.exit(1);
});