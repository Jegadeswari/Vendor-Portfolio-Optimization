# Vendor Spend Strategy Assessment — AI-Orchestrated Workflow

## Purpose
This workflow operationalizes vendor spend due diligence using Claude Code CLI.
It converts a manual spreadsheet-based analysis into a repeatable AI-enabled process
that assesses vendor portfolios and identifies cost optimization opportunities.

It is read by `scripts/vendor_rationalization.sh`, which extracts each step's prompt
and passes it to Claude Code CLI via stdin pipe (printf "%s" "$prompt" | claude).

Each step is delimited by `<!-- STEP:N -->` and `<!-- /STEP:N -->` markers.
The script substitutes `${WORKBOOK}` with the absolute workbook path before execution.

## Workbook Safety Rules

When writing to Excel worksheets:
- Never recreate or replace an entire worksheet.
- Never use XLSX.utils.aoa_to_sheet or any method that rebuilds the sheet.
- Only update the specific cells required for the task.
- Always preserve existing column headers, formatting, and template structure.
- Preserve the first row (column headers), first column if it contains row labels,
  and the instruction cell (A1).
- Column additions are allowed ONLY when explicitly required by the workflow
  (e.g., adding 'Estimated Annual Savings (USD)' in the 'Top 3 Opportunities' sheet).
- All other updates must modify existing cells only.

## Allowed Values Reference

**Departments (13 allowed values):**
```
Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product | Professional Services | Sales | Support | Finance | Unknown
```

**Recommendations (3 allowed values):**
```
Terminate | Consolidate | Optimize
```

---

<!-- STEP:01 -->
You are performing STEP 01 of the Vendor Spend Strategy assessment.

TASK: Inspect workbook structure.

The workbook is located at: ${WORKBOOK}

Use Node.js with the xlsx package to open and inspect the workbook. Run the following
inspection script using the Bash tool:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');

console.log('=== WORKBOOK INSPECTION ===');
console.log('Sheets found:', wb.SheetNames);

const requiredSheets = [
  'Vendor Analysis Assessment',
  'Top 3 Opportunities',
  'Methodology',
  'CEOCFO Recommendations'
];

requiredSheets.forEach(name => {
  const found = wb.SheetNames.includes(name);
  console.log(`Sheet '${name}': ${found ? 'PRESENT' : 'MISSING'}`);
});

// Inspect Vendor Analysis Assessment columns
const ws = wb.Sheets['Vendor Analysis Assessment'];
if (ws) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const headers = data[0] || [];
  console.log('\nVendor Analysis Assessment columns:', headers);
  const requiredCols = ['Vendor Name', 'Last 12 months Cost (USD)'];
  requiredCols.forEach(col => {
    console.log(`Column '${col}': ${headers.includes(col) ? 'PRESENT' : 'MISSING'}`);
  });
  console.log('\nTotal vendor rows (excluding header):', data.length - 1);
}
```

Save this script as a temporary file and execute it. Report the full inspection results.
Confirm that all required sheets and columns are present before proceeding.
<!-- /STEP:01 -->

---

<!-- STEP:02 -->
You are performing STEP 02 of the Vendor Spend Strategy assessment.

TASK: Read template instruction constraints from every worksheet.

The workbook is located at: ${WORKBOOK}

Use Node.js with the xlsx package to inspect cell A1 (Row 1, Column 1) of each worksheet.
These cells may contain embedded instructions governing structure, format, word limits,
or output constraints for that sheet.

Run the following script using the Bash tool:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');

console.log('=== TEMPLATE INSTRUCTION INSPECTION ===');
wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const a1 = ws['A1'];
  const value = a1 ? (a1.v || a1.w || '') : '(empty)';
  console.log(`\nSheet: ${name}`);
  console.log(`A1 instruction: ${value}`);
});
```

Report the full content of each A1 cell. These instructions take precedence over
workflow guidance where they conflict. Summarise any constraints that will affect
how outputs must be formatted in later steps.
<!-- /STEP:02 -->

---

<!-- STEP:03 -->
You are performing STEP 03 of the Vendor Spend Strategy assessment.

TASK: Perform vendor spend analysis.

The workbook is located at: ${WORKBOOK}

Use Node.js with the xlsx package to read the Vendor Analysis Assessment sheet and
calculate the following metrics. Run this script using the Bash tool:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);

// Total spend
const totalSpend = data.reduce((sum, row) => {
  const val = parseFloat(row['Last 12 months Cost (USD)']) || 0;
  return sum + val;
}, 0);

// Sort by spend descending
const sorted = [...data].sort((a, b) =>
  (parseFloat(b['Last 12 months Cost (USD)']) || 0) -
  (parseFloat(a['Last 12 months Cost (USD)']) || 0)
);

// Top 10
const top10 = sorted.slice(0, 10);
const top10Spend = top10.reduce((sum, r) => sum + (parseFloat(r['Last 12 months Cost (USD)']) || 0), 0);

// Long-tail (< $50K) and high-spend (>= $200K)
const longTail = data.filter(r => (parseFloat(r['Last 12 months Cost (USD)']) || 0) < 50000);
const highSpend = data.filter(r => (parseFloat(r['Last 12 months Cost (USD)']) || 0) >= 200000);

console.log('=== VENDOR SPEND ANALYSIS ===');
console.log('Total vendor count:', data.length);
console.log('Total spend (USD):', totalSpend.toLocaleString('en-US', {style:'currency', currency:'USD'}));
console.log('\nTop 10 vendors by spend:');
top10.forEach((r, i) => {
  const spend = parseFloat(r['Last 12 months Cost (USD)']) || 0;
  const pct = ((spend / totalSpend) * 100).toFixed(1);
  console.log(`  ${i+1}. ${r['Vendor Name']} — $${spend.toLocaleString()} (${pct}%)`);
});
console.log('\nTop 10 combined spend:', '$' + top10Spend.toLocaleString());
console.log('Top 10 spend concentration:', ((top10Spend / totalSpend) * 100).toFixed(1) + '%');
console.log('\nLong-tail vendors (< $50K):', longTail.length);
longTail.forEach(r => console.log('  -', r['Vendor Name'], '—', '$' + (parseFloat(r['Last 12 months Cost (USD)']) || 0).toLocaleString()));
console.log('\nHigh-spend vendors (>= $200K):', highSpend.length);
highSpend.forEach(r => console.log('  -', r['Vendor Name'], '—', '$' + (parseFloat(r['Last 12 months Cost (USD)']) || 0).toLocaleString()));
```

Report the full analysis results. Store the findings for use in STEP 09.
<!-- /STEP:03 -->

---

<!-- STEP:04 -->
You are performing STEP 04 of the Vendor Spend Strategy assessment.

TASK: Classify vendor categories and assign departments.

The workbook is located at: ${WORKBOOK}

Use Node.js to read all vendor names from the Vendor Analysis Assessment sheet:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(row['Vendor Name'], '|', row['Last 12 months Cost (USD)']);
});
```

For each vendor, use your domain knowledge to:

1. Infer the vendor's service category from the vendor name. Example categories:
   Cloud Infrastructure · Data Platforms · Security · Marketing Automation · CRM ·
   Developer Tools · Analytics · Facilities · Legal Services · Recruiting ·
   Productivity SaaS · Professional Services

2. Map the vendor to exactly ONE department from this allowed list:
   Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
   Professional Services | Sales | Support | Finance

Report a full classification table showing Vendor Name, Spend, Category, and Department
for every vendor. This will be used in STEP 05.

Classify every vendor in a single pass. Do not retry or patch unmatched vendors —
assign best-guess department based on name context. If truly unidentifiable, assign G&A.
Produce the classification table once and stop.

<!-- /STEP:04 -->

---

<!-- STEP:05 -->
You are performing STEP 05 of the Vendor Spend Strategy assessment.

TASK: Populate vendor analysis columns and output the classification as a JSON array.

After producing the JSON array, immediately write it to a file using the Bash tool.
Run this exact command, replacing THE_ARRAY with your completed array:

node -e "
const fs = require('fs');
const data = THE_ARRAY;
fs.writeFileSync('/tmp/step05_vendors.json', JSON.stringify(data, null, 2));
console.log('JSON_WRITTEN_OK records:' + data.length);
"

Confirm JSON_WRITTEN_OK appears in the output before proceeding.

The workbook is located at: ${WORKBOOK}

Use Node.js to read all vendors:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(JSON.stringify({
    name: row['Vendor Name'],
    spend: row['Last 12 months Cost (USD)']
  }));
});
```
CRITICAL — Vendor Name in the JSON output:

The Node.js script above prints every vendor name exactly as it appears in the spreadsheet. 
You MUST copy each "Vendor Name" value into the JSON character-for-character from that printed output. 
Do not retype it from memory. Do not change capitalisation, punctuation, spacing, or spelling. Do not abbreviate. 

If the spreadsheet shows
"Navan (Tripactions Inc)" your JSON must say "Navan (Tripactions Inc)" — not "Navan", not "Navan TripActions", not any other variation.

The lookup that writes to the workbook is case-sensitive and exact-match only.
Any deviation means that vendor row will be silently skipped and left blank.

For EVERY vendor row, determine:

- **Department**: One of the 12 allowed values:
  Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
  Professional Services | Sales | Support | Finance

- **Description**: A single concise sentence (max 120 characters) describing what the vendor does.

- **Suggestion**: Exactly one of: Terminate | Consolidate | Optimize

  Recommendation logic:
  - **Terminate**: Low-spend vendors (< $50K), redundant services, long-tail vendors with minimal strategic value
  - **Consolidate**: Duplicate vendors in the same category, overlapping SaaS products or services
  - **Optimize**: High-spend strategic vendors where contract renegotiation, license right-sizing, or pricing optimization can generate savings

After your analysis, output ONLY a valid JSON array in this exact format. The JSON array
must contain every vendor. Do not truncate. Do not include markdown fences around the final array:

[
  {
    "Vendor Name": "<<copied verbatim from the Node.js output above>>",
    "Department": "one of the 12 allowed departments",
    "Description": "one-line description of what this vendor does",
    "Suggestion": "Terminate|Consolidate|Optimize"
  }
]

After outputting the JSON array, immediately write it to a file using the Bash tool:
```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const outPath = path.join(os.tmpdir(), 'step05_vendors.json');
const data = PASTE_YOUR_ARRAY_VARIABLE_HERE;
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log('JSON_WRITTEN_OK records:' + data.length);
console.log('Written to:', outPath);
```

Replace PASTE_YOUR_ARRAY_VARIABLE_HERE with the actual array variable from your script.
Confirm JSON_WRITTEN_OK appears in the output before proceeding.

<!-- /STEP:05 -->

---

<!-- STEP:06 -->
You are performing STEP 06 of the Vendor Spend Strategy assessment.

TASK: Capture decision rationale for each recommendation.

The workbook is located at: ${WORKBOOK}

Use Node.js to read the populated vendor data:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(JSON.stringify({
    vendor: row['Vendor Name'],
    spend: row['Last 12 months Cost (USD)'],
    department: row['Department'],
    suggestion: row['Suggestions (Consolidate / Terminate / Optimize costs)']
  }));
});
```

For each vendor, record a concise rationale (1–2 sentences) explaining why the
recommendation was made. Reference factors such as:

- Vendor spend level relative to thresholds ($50K = long-tail, $200K = high-spend strategic)
- Category overlap or duplication with other vendors
- Strategic importance to product or operations
- Potential for renegotiation, right-sizing, or consolidation

Output a rationale report with each vendor name and its reasoning.
This log is for auditability and does not need to be written to the workbook.
<!-- /STEP:06 -->

---

<!-- STEP:07 -->
You are performing STEP 07 of the Vendor Spend Strategy assessment.

TASK: Detect duplicate vendor categories and consolidation opportunities.

The workbook is located at: ${WORKBOOK}

Use Node.js to read vendor data:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(row['Vendor Name'], '|', row['Last 12 months Cost (USD)'], '|', row['Department']);
});
```

Using the vendor names, spend data, and your domain knowledge:

1. Group vendors by inferred service category (e.g., CRM, Cloud Infrastructure, Security).
2. Identify categories that contain multiple vendors performing similar functions.
3. Calculate combined spend per duplicate category.
4. Flag specific vendor pairs or groups as consolidation candidates.

Report a consolidation opportunity analysis listing:
- Category name
- Vendors in that category
- Combined spend for the category
- Recommended consolidation action (which vendor to retain, which to consolidate away)
<!-- /STEP:07 -->

---

<!-- STEP:08 -->
You are performing STEP 08 of the Vendor Spend Strategy assessment.

TASK: Score vendors by strategic importance and refine recommendations.

The workbook is located at: ${WORKBOOK}

Use Node.js to read vendor data:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(row['Vendor Name'], '|', row['Last 12 months Cost (USD)']);
});
```

For each vendor, evaluate strategic importance based on:
- Role in product infrastructure (core engineering platform vs. peripheral tool)
- Customer-facing capabilities (directly impacts product or customer experience)
- Operational criticality (business would halt without it)
- Redundancy or overlap with other vendors in the portfolio

Assign each vendor a strategic tier:
- **Tier 1 — Strategic**: Mission-critical, irreplaceable → Optimize
- **Tier 2 — Important**: Valuable but substitutable → Optimize or Consolidate
- **Tier 3 — Peripheral**: Non-critical, easily replaced or eliminated → Consolidate or Terminate

Report a scoring table for all vendors and flag any recommendation adjustments.
<!-- /STEP:08 -->

---

<!-- STEP:09 -->
You are performing STEP 09 of the Vendor Spend Strategy assessment.

TASK: Identify the top 3 cost optimization opportunities and write them to the workbook.

The workbook is located at: ${WORKBOOK}

First, use Node.js to read the Top 3 Opportunities sheet to understand its current structure:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Top 3 Opportunities'];
if (ws) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('Headers:', data[0]);
  console.log('Row 1 (A1) instruction:', data[0] ? data[0][0] : 'empty');
  console.log('All rows:');
  data.forEach((row, i) => console.log(i, row));
}
```

Based on your analysis from Steps 03–08, identify the three highest-impact cost
optimization opportunities. Focus on:
- High-spend vendor renegotiation (benchmark: 10–15% savings)
- SaaS license optimization and right-sizing (benchmark: 15–30% savings)
- Vendor consolidation opportunities (benchmark: 15–20% savings)
- Long-tail vendor cleanup

For each opportunity:
- **Opportunity Title**: Descriptive title
- **Explanation**: 2–4 sentences on why this is high impact and what action to take
- **Estimated Annual Savings (USD)**: Dollar figure derived from spend benchmarks above

Write ONLY to the data cells for Opportunity Title, Explanation, and Estimated Annual Savings.
Do NOT modify the header row or A1 instruction cell.
Preserve all existing sheet structure.

If 'Estimated Annual Savings (USD)' column does not exist, add it — this is the only
permitted column addition.

Use Node.js to write the three opportunities to the sheet, updating only the specific
cells for rows 2, 3, and 4. Use XLSX.utils.encode_cell to write individual cells.
Do not use aoa_to_sheet or methods that rebuild the sheet.
<!-- /STEP:09 -->

---

<!-- STEP:10 -->
You are performing STEP 10 of the Vendor Spend Strategy assessment.

TASK: Record analysis metrics for the audit trail.

The workbook is located at: ${WORKBOOK}

Use Node.js to read the current state of the workbook and compile audit metrics:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);

const totalSpend = data.reduce((s, r) => s + (parseFloat(r['Last 12 months Cost (USD)']) || 0), 0);
const sorted = [...data].sort((a, b) => (parseFloat(b['Last 12 months Cost (USD)']) || 0) - (parseFloat(a['Last 12 months Cost (USD)']) || 0));
const top10Spend = sorted.slice(0,10).reduce((s,r) => s + (parseFloat(r['Last 12 months Cost (USD)']) || 0), 0);
const longTail = data.filter(r => (parseFloat(r['Last 12 months Cost (USD)']) || 0) < 50000);
const byDept = {};
data.forEach(r => { const d = r['Department'] || 'Unknown'; byDept[d] = (byDept[d] || 0) + 1; });
const bySugg = {};
data.forEach(r => { const s = r['Suggestions (Consolidate / Terminate / Optimize costs)'] || 'Unknown'; bySugg[s] = (bySugg[s] || 0) + 1; });

console.log('=== ANALYSIS METRICS AUDIT TRAIL ===');
console.log('Total vendor count:', data.length);
console.log('Total spend:', '$' + totalSpend.toLocaleString());
console.log('Top 10 spend concentration:', ((top10Spend / totalSpend) * 100).toFixed(1) + '%');
console.log('Long-tail vendors (< $50K):', longTail.length);
console.log('Recommendations by type:', JSON.stringify(bySugg, null, 2));
console.log('Vendors by department:', JSON.stringify(byDept, null, 2));
```

Report these metrics in full. These are for the execution log only and do not need to
be written to the workbook.
<!-- /STEP:10 -->

---

<!-- STEP:11 -->
You are performing STEP 11 of the Vendor Spend Strategy assessment.

TASK: Populate the Methodology sheet.

The workbook is located at: ${WORKBOOK}

First, read the Methodology sheet to understand its current structure and any template
instructions in A1:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Methodology'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('Sheet structure:');
data.forEach((row, i) => console.log(i, row));
```

Write a structured methodology explanation covering these stages:
1. Workbook inspection and validation
2. Vendor spend analysis and concentration assessment
3. Vendor categorization and department classification
4. Duplicate vendor detection and consolidation analysis
5. Recommendation generation (Terminate / Consolidate / Optimize)
6. Opportunity identification and savings estimation
7. Executive recommendation development

Comply with any template instructions found in A1.
Do NOT overwrite the A1 instruction cell.
Write content to the appropriate data cells only, preserving all existing structure.
Use XLSX.utils.encode_cell to write individual cells. Do not use aoa_to_sheet.
<!-- /STEP:11 -->

---

<!-- STEP:12 -->
You are performing STEP 12 of the Vendor Spend Strategy assessment.

TASK: Generate the CEO/CFO executive memo.

The workbook is located at: ${WORKBOOK}

First, read the CEOCFO Recommendations sheet and read vendor spend data:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');

// Read sheet structure
const ceoWs = wb.Sheets['CEOCFO Recommendations'];
const ceoData = XLSX.utils.sheet_to_json(ceoWs, { header: 1 });
console.log('CEOCFO sheet structure:');
ceoData.forEach((row, i) => console.log(i, row));

// Read vendor data for memo content
const ws = wb.Sheets['Vendor Analysis Assessment'];
const vendors = XLSX.utils.sheet_to_json(ws);
const totalSpend = vendors.reduce((s,r) => s + (parseFloat(r['Last 12 months Cost (USD)']) || 0), 0);
const bySugg = {};
vendors.forEach(r => { const s = r['Suggestions (Consolidate / Terminate / Optimize costs)'] || 'Unknown'; bySugg[s] = (bySugg[s]||0)+1; });
console.log('Total spend:', '$' + totalSpend.toLocaleString(), '| Vendors:', vendors.length);
console.log('Recommendations:', JSON.stringify(bySugg));
```

Write a MAXIMUM 1-PAGE executive memo to the CEOCFO Recommendations sheet.

The audience is the CEO and CFO — they are busy. Every sentence must earn its place.
Cut anything obvious. No preamble. No padding. No repetition.

The memo must fit on one page when printed. Enforce this strictly by limiting content:
- Each section: 1–2 sentences maximum, except Top 3 Opportunities (3 bullet points)
- Implementation Roadmap: 4 bullets of 10 words each maximum
- Risks: 2 bullets only — the two highest-impact risks

Structure (all six sections, ultra-compressed):

TO: Chief Executive Officer | Chief Financial Officer
FROM: [your name/role]
DATE: [today]
RE: Vendor Spend Rationalisation — Findings & Recommendations

VENDOR SPEND OVERVIEW
[1 sentence: total vendors, total spend, dominant recommendation split]

MAJOR COST DRIVERS
[1 sentence: top vendor by name, spend amount, % of total, and second tier]

TOP 3 OPPORTUNITIES
- [Opportunity 1 title]: [action + savings in USD]
- [Opportunity 2 title]: [action + savings in USD]
- [Opportunity 3 title]: [action + savings in USD]
Total estimated savings: $[total]

ESTIMATED SAVINGS SUMMARY
[1–2 sentences: total savings, % of spend, Year 1 realisable amount]

IMPLEMENTATION ROADMAP
- Month 1–2: [one action, max 10 words]
- Month 3–4: [one action, max 10 words]
- Month 4–6: [one action, max 10 words]
- Month 6+: [one action, max 10 words]

RISKS
- [Risk 1]: [mitigation in 8 words]
- [Risk 2]: [mitigation in 8 words]

Recommended next step: [one sentence]

Tone: executive, data-driven, no hedging.
Do NOT overwrite the A1 instruction cell.
Do NOT write to A2.

Write the complete memo as a single continuous text block into cell A3 only.
Use \n for line breaks within the string. Use double \n\n between sections.
Use XLSX.utils.encode_cell to write ONLY to A3.
Do not use aoa_to_sheet or methods that rebuild the sheet.
<!-- /STEP:12 -->

---

<!-- STEP:13 -->
You are performing STEP 13 of the Vendor Spend Strategy assessment.

TASK: Validate all vendor rows and outputs.

The workbook is located at: ${WORKBOOK}

Use Node.js to validate the workbook:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);

const allowedDepts = new Set(['Engineering','Facilities','G&A','Legal','M&A','Marketing','SaaS','Product','Professional Services','Sales','Support','Finance', 'Unknown']);
const allowedSugg = new Set(['Terminate','Consolidate','Optimize']);

let issues = [];
data.forEach((row, i) => {
  const rowNum = i + 2;
  if (!row['Department'] || !allowedDepts.has(row['Department']))
    issues.push(`Row ${rowNum} (${row['Vendor Name']}): invalid or missing Department: '${row['Department']}'`);
  if (!row['1-line Description on what the Vendor does'])
    issues.push(`Row ${rowNum} (${row['Vendor Name']}): missing Description`);
  const sugg = row['Suggestions (Consolidate / Terminate / Optimize costs)'];
  if (!sugg || !allowedSugg.has(sugg))
    issues.push(`Row ${rowNum} (${row['Vendor Name']}): invalid or missing Suggestion: '${sugg}'`);
});

if (issues.length === 0) {
  console.log('VALIDATION PASSED — all', data.length, 'vendor rows are complete and valid.');
} else {
  console.log('VALIDATION ISSUES FOUND:', issues.length);
  issues.forEach(i => console.log(' -', i));
}
```

Report validation results. If issues are found, fix them by updating the affected cells
using XLSX.utils.encode_cell before saving. Do not rebuild the sheet.
Confirm that Top 3 Opportunities are populated and all outputs comply with template instructions.
<!-- /STEP:13 -->

---

<!-- STEP:14 -->
You are performing STEP 14 of the Vendor Spend Strategy assessment.

TASK: Review and improve analysis quality.

The workbook is located at: ${WORKBOOK}

Use Node.js to read the full vendor analysis:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(JSON.stringify({
    vendor: row['Vendor Name'],
    spend: row['Last 12 months Cost (USD)'],
    dept: row['Department'],
    desc: row['1-line Description on what the Vendor does'],
    sugg: row['Suggestions (Consolidate / Terminate / Optimize costs)']
  }));
});
```

Perform a second-pass quality review:
1. Re-evaluate vendor department assignments — are there any clear misclassifications?
2. Improve vendor description accuracy — are descriptions precise and informative?
3. Verify recommendation alignment with vendor strategic importance and spend level
4. Confirm Top 3 Opportunities represent the largest potential savings

If improvements are needed, update the affected cells using XLSX.utils.encode_cell.
Preserve all existing sheet structure. Do not rebuild the sheet.
Report a summary of any changes made and the final quality assessment.
<!-- /STEP:14 -->

---

<!-- STEP:15 -->
You are performing STEP 15 of the Vendor Spend Strategy assessment.

TASK: Perform confidence and review check — flag low-confidence items.

The workbook is located at: ${WORKBOOK}

Use Node.js to read the final vendor data:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');
const ws = wb.Sheets['Vendor Analysis Assessment'];
const data = XLSX.utils.sheet_to_json(ws);
data.forEach(row => {
  console.log(row['Vendor Name'], '|', row['Department'], '|', row['Suggestions (Consolidate / Terminate / Optimize costs)']);
});
```

Evaluate confidence level for each classification. Flag vendors for human review if:
- Vendor identity is unclear from the name alone
- Service category is ambiguous
- Department classification is uncertain
- Limited context about the vendor's function

Specifically ensure:
- All high-impact Terminate recommendations have strong analytical justification
- All major Consolidate recommendations identify the specific overlap or duplication
- All Optimize recommendations identify the specific renegotiation or right-sizing lever

Report a confidence summary listing:
- Total vendors reviewed
- High-confidence classifications count
- Low-confidence / flagged for review count
- Specific vendors flagged, with reason

Only proceed to STEP 16 after this review is complete.
<!-- /STEP:15 -->

---

<!-- STEP:16 -->
You are performing STEP 16 of the Vendor Spend Strategy assessment.

TASK: Confirm final workbook state and ensure it is saved.

The workbook is located at: ${WORKBOOK}

Use Node.js to perform a final read and confirm the workbook is complete:

```javascript
const XLSX = require('xlsx');
const wb = XLSX.readFile('${WORKBOOK}');

console.log('=== FINAL WORKBOOK STATE ===');
console.log('Sheets:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\nSheet: ${name} — ${data.length} rows`);
  if (name === 'Vendor Analysis Assessment') {
    const vendors = XLSX.utils.sheet_to_json(ws);
    const populated = vendors.filter(r =>
      r['Department'] && r['1-line Description on what the Vendor does'] &&
      r['Suggestions (Consolidate / Terminate / Optimize costs)']
    );
    console.log(`  Vendors total: ${vendors.length}, fully populated: ${populated.length}`);
  }
});
```

The workbook at ${WORKBOOK} is the live file. All previous steps have been writing
directly to this file. Confirm the final state is correct.

If any step's changes were not persisted, re-apply them now using XLSX.utils.encode_cell
to update individual cells, then save using XLSX.writeFile.

Report the final confirmation that the assessment is complete, including:
- Total vendors classified
- Breakdown by recommendation type (Terminate / Consolidate / Optimize)
- Top 3 Opportunities populated: yes/no
- Methodology sheet populated: yes/no
- CEOCFO Recommendations sheet populated: yes/no
- Workbook path confirmed: ${WORKBOOK}
<!-- /STEP:16 -->
