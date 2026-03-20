const XLSX = require('xlsx');
const path = require('path');

const WORKBOOK_PATH = path.join('C:/Users/rjega/vendor-spend-analysis/outputs',
  'A - TEMPLATE - RWA - Vendor Spend Strategy (R Jegadeswari).xlsx');

const VALID_DEPARTMENTS = new Set([
  'Engineering','Facilities','G&A','Legal','M&A','Marketing','SaaS','Product',
  'Professional Services','Sales','Support','Finance','Unknown'
]);
const VALID_SUGGESTIONS = new Set(['Optimize','Consolidate','Terminate','Unknown']);

const wb = XLSX.readFile(WORKBOOK_PATH, { cellStyles: true, bookVBA: false });

const SHEET = 'Vendor Analysis Assessment';
const ws = wb.Sheets[SHEET];
if (!ws) { console.error('Sheet not found:', SHEET); process.exit(1); }

const range = XLSX.utils.decode_range(ws['!ref']);
console.log(`Sheet range: ${ws['!ref']}`);

// Find header row
let headerRow = -1;
for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    if (cell && String(cell.v).trim() === 'Vendor Name') { headerRow = r; break; }
  }
  if (headerRow >= 0) break;
}
if (headerRow < 0) { console.error('Could not find header row'); process.exit(1); }
console.log(`Header row index: ${headerRow}`);

const colMap = {};
for (let c = range.s.c; c <= range.e.c; c++) {
  const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c })];
  if (cell && cell.v) colMap[String(cell.v).trim()] = c;
}
console.log('Columns found:', Object.keys(colMap).join(' | '));

const COL_VENDOR = colMap['Vendor Name'];
const COL_DEPT   = colMap['Department'];
const COL_DESC   = colMap['1-line Description on what the Vendor does'];
const COL_SUGG   = colMap['Suggestions (Consolidate / Terminate / Optimize costs)'];

if (COL_VENDOR === undefined) { console.error('Vendor Name column not found'); process.exit(1); }
if (COL_DEPT   === undefined) { console.error('Department column not found'); process.exit(1); }
if (COL_DESC   === undefined) { console.error('Description column not found'); process.exit(1); }
if (COL_SUGG   === undefined) { console.error('Suggestions column not found'); process.exit(1); }

console.log(`Column indices — Vendor:${COL_VENDOR} Dept:${COL_DEPT} Desc:${COL_DESC} Sugg:${COL_SUGG}\n`);

const corrections = [];
let passed = 0, failed = 0, total = 0;

for (let r = headerRow + 1; r <= range.e.r; r++) {
  const vendorCell = ws[XLSX.utils.encode_cell({ r, c: COL_VENDOR })];
  const vendorName = vendorCell ? String(vendorCell.v).trim() : '';
  const deptCell = ws[XLSX.utils.encode_cell({ r, c: COL_DEPT })];
  const descCell = ws[XLSX.utils.encode_cell({ r, c: COL_DESC })];
  const suggCell = ws[XLSX.utils.encode_cell({ r, c: COL_SUGG })];
  if (!vendorName && !deptCell && !descCell && !suggCell) continue;

  total++;
  const errors = [];

  const deptVal = deptCell ? String(deptCell.v).trim() : '';
  if (!deptVal || !VALID_DEPARTMENTS.has(deptVal)) {
    errors.push(`Department="${deptVal || '(empty)'}" invalid`);
    corrections.push({ r, c: COL_DEPT, value: 'Unknown', label: `Row${r+1} Dept → Unknown (was "${deptVal}")` });
  }

  const descVal = descCell ? String(descCell.v).trim() : '';
  if (!descVal) {
    errors.push('Description is empty');
    corrections.push({ r, c: COL_DESC, value: `${vendorName || 'Vendor'} — description pending review`, label: `Row${r+1} Desc → placeholder` });
  }

  const suggVal = suggCell ? String(suggCell.v).trim() : '';
  if (!suggVal || !VALID_SUGGESTIONS.has(suggVal)) {
    errors.push(`Suggestions="${suggVal || '(empty)'}" invalid`);
    corrections.push({ r, c: COL_SUGG, value: 'Unknown', label: `Row${r+1} Sugg → Unknown (was "${suggVal}")` });
  }

  if (errors.length === 0) {
    console.log(`  PASS: ${vendorName || '(blank vendor)'}`);
    passed++;
  } else {
    console.log(`  FAIL: ${vendorName || '(blank vendor)'} — ${errors.join('; ')}`);
    failed++;
  }
}

if (corrections.length > 0) {
  console.log(`\n── Applying ${corrections.length} correction(s) ──`);
  for (const fix of corrections) {
    const addr = XLSX.utils.encode_cell({ r: fix.r, c: fix.c });
    if (!ws[addr]) ws[addr] = { t: 's' };
    ws[addr].v = fix.value;
    ws[addr].t = 's';
    delete ws[addr].f;
    console.log(`  ${fix.label}`);
  }
  XLSX.writeFile(wb, WORKBOOK_PATH);
  console.log('\nWorkbook saved.');
} else {
  console.log('\nNo corrections needed.');
}

console.log('\n── Other sheet checks ──');

const wsTop3 = wb.Sheets['Top 3 Opportunities'];
if (!wsTop3) {
  console.log('FAIL: Top 3 Opportunities sheet missing');
} else {
  const top3Range = XLSX.utils.decode_range(wsTop3['!ref'] || 'A1:A1');
  let dataRows = 0;
  for (let r = top3Range.s.r + 1; r <= top3Range.e.r; r++) {
    const c0 = wsTop3[XLSX.utils.encode_cell({ r, c: 0 })];
    if (c0 && c0.v) dataRows++;
  }
  console.log(`Top 3 Opportunities: ${dataRows} data row(s) → ${dataRows >= 3 ? 'PASS' : 'FAIL'}`);
  for (let r = 0; r <= Math.min(top3Range.e.r, 5); r++) {
    const row = [];
    for (let c = 0; c <= Math.min(top3Range.e.c, 4); c++) {
      const cell = wsTop3[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? String(cell.v).substring(0, 50) : '');
    }
    if (row.some(v => v)) console.log(`  Row ${r+1}: ${row.join(' | ')}`);
  }
}

const wsMethod = wb.Sheets['Methodology'];
if (!wsMethod) {
  console.log('FAIL: Methodology sheet missing');
} else {
  const mRange = XLSX.utils.decode_range(wsMethod['!ref'] || 'A1:A1');
  let methodCells = 0;
  for (let r = mRange.s.r; r <= mRange.e.r; r++)
    for (let c = mRange.s.c; c <= mRange.e.c; c++) {
      const cell = wsMethod[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v) methodCells++;
    }
  console.log(`Methodology: ${methodCells} non-empty cell(s) → ${methodCells > 0 ? 'PASS' : 'FAIL'}`);
}

const wsCEO = wb.Sheets['CEOCFO Recommendations'];
if (!wsCEO) {
  console.log('FAIL: CEOCFO Recommendations sheet missing');
} else {
  const a3 = wsCEO['A3'];
  const a3val = a3 ? String(a3.v).trim() : '';
  console.log(`CEOCFO Recommendations A3: ${a3val.length > 0 ? 'PASS' : 'FAIL'} (length=${a3val.length})`);
  if (a3val.length > 0) console.log(`  Preview: "${a3val.substring(0, 150)}..."`);
}

console.log('\n══════════════════════════════════════');
console.log(`Total rows validated : ${total}`);
console.log(`Passed               : ${passed}`);
console.log(`Failed and corrected : ${failed}`);
console.log('══════════════════════════════════════');
