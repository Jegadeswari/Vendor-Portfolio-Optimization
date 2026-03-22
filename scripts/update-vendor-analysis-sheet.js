// ============================================================================
// update-vendor-analysis-sheet.js
// ----------------------------------------------------------------------------
// Updates the following columns in the 'Vendor Analysis Assessment' sheet:
//   - Department
//   - 1-line Description on what the Vendor does
//   - Suggestions (Consolidate / Terminate / Optimize costs)
//
// Inputs:
//   1. Workbook path
//   2. JSON classification output from STEP 05
//
// Example:
// node scripts/update-vendor-analysis-sheet.js workbook.xlsx step05_output.json
// ============================================================================

const XLSX = require("xlsx");
const fs = require("fs");

// Inputs
const workbookPath = process.argv[2];
const jsonPath = process.argv[3];

if (!workbookPath || !jsonPath) {
  console.error("Usage: node update-vendor-analysis-sheet.js <workbook> <jsonfile>");
  process.exit(1);
}

// Load workbook
const wb = XLSX.readFile(workbookPath);

const sheetName = "Vendor Analysis Assessment";
const ws = wb.Sheets[sheetName];

if (!ws) {
  console.error(`Sheet not found: ${sheetName}`);
  process.exit(1);
}

// Convert sheet to array-of-arrays (for header detection)
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Load JSON classification output
let classifications;

try {
  classifications = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch (err) {
  console.error("Failed to parse JSON classification output.");
  console.error(err.message);
  process.exit(1);
}

// Enforce expected row count
if (classifications.length !== 386) {
  console.error(`Row count mismatch: expected 386, got ${classifications.length}`);
  process.exit(1);
}

// Deduplicate vendor entries
const seen = new Set();
classifications = classifications.filter(v => {
  const key = String(v["Vendor Name"]).normalize("NFKD").trim();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Build lookup table
const lookup = new Map();
classifications.forEach(v => {
  lookup.set(
    String(v["Vendor Name"]).normalize("NFKD").trim(),
    v
  );
});

// Identify column indexes
const header = data[0];

const vendorCol = header.indexOf("Vendor Name");
const deptCol = header.indexOf("Department");
const descCol = header.indexOf("1-line Description on what the Vendor does");
const suggCol = header.indexOf("Suggestions (Consolidate / Terminate / Optimize costs)");

if (vendorCol === -1 || deptCol === -1 || descCol === -1 || suggCol === -1) {
  console.error("One or more required columns were not found in the worksheet.");
  console.error("Detected headers:", header);
  process.exit(1);
}

let updates = 0;

// Update rows
for (let i = 1; i < data.length; i++) {

  const vendorName = String(data[i][vendorCol])
    .normalize("NFKD")
    .trim();

  if (!vendorName) continue;

  const result = lookup.get(vendorName);

  if (!result) { console.log(`[MISSED] Row ${i + 1}: "${vendorName}"`); continue; }

  // Write directly to worksheet cells (preserves formatting)

  ws[XLSX.utils.encode_cell({ r: i, c: deptCol })] = {
    t: "s",
    v: result["Department"]
  };

  ws[XLSX.utils.encode_cell({ r: i, c: descCol })] = {
    t: "s",
    v: result["Description"]
  };

  ws[XLSX.utils.encode_cell({ r: i, c: suggCol })] = {
    t: "s",
    v: result["Suggestion"]
  };

  console.log(`[update-vendor-analysis-sheet] Updated vendor: ${vendorName}`);

  updates++;
}

// Write workbook safely (atomic write)

const tempPath = workbookPath.replace(".xlsx", ".tmp.xlsx");

console.log("Applying updates to workbook...");
XLSX.writeFile(wb, tempPath);

fs.renameSync(tempPath, workbookPath);


console.log(`Excel update complete. Rows updated: ${updates}`);