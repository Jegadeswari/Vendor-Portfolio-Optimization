# Vendor Spend Strategy — Workflow Prompts

This file contains the complete workflow logic for the Vendor Spend Strategy assessment.
It is read by `scripts/vendor_rationalization.sh`, which extracts each step's prompt
and passes it to Claude Code CLI via `claude -p`.

Each step is delimited by `<!-- STEP:N -->` and `<!-- /STEP:N -->` markers.
The script substitutes `${WORKBOOK}` with the absolute workbook path before execution.

---

WORKBOOK UPDATE SAFETY RULES

When writing to Excel worksheets:

• Never recreate or replace an entire worksheet.
• Never use XLSX.utils.aoa_to_sheet or any method that rebuilds the sheet.
• Only update the specific cells required for the task.
• Always preserve existing column headers, formatting, and template structure.
• Preserve the first row (column headers), first column (row labels), and the instruction cell (A1).
• Column additions are allowed ONLY when explicitly required by the workflow 
(e.g., adding 'Estimated Annual Savings (USD)' in the 'Top 3 Opportunities' sheet).

All other updates must modify existing cells only.

---

<!-- STEP:01 -->
You are a vendor spend analyst.

Your task is to inspect the Excel workbook at:
  ${WORKBOOK}

Use the Bash tool to run Node.js to:

1. List all sheet names in the workbook.
2. List all column headers in the sheet named 'Vendor Analysis Assessment'.
3. Print the first 5 data rows of 'Vendor Analysis Assessment'.

Use this Node.js pattern (run via bash):
  node -e "
    const XLSX = require('xlsx');
    const wb = XLSX.readFile('${WORKBOOK}');
    console.log('Sheets:', wb.SheetNames);
    const ws = wb.Sheets['Vendor Analysis Assessment'];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log('Headers:', JSON.stringify(data[0]));
    console.log('Sample rows:', JSON.stringify(data.slice(1, 6), null, 2));
  "

Confirm the following required sheets are present:
  - Vendor Analysis Assessment
  - Top 3 Opportunities
  - Methodology
  - CEOCFO Recommendations

Report any missing sheets.

Confirm the following columns exist in 'Vendor Analysis Assessment':
  - Vendor Name
  - Last 12 months Cost (USD)

These columns must NOT be modified.

Print a summary of sheets found, columns confirmed, and the first 3 vendor names and costs.
<!-- /STEP:01 -->

---

<!-- STEP:02 -->
You are a vendor spend analyst.

Inspect the Excel workbook at:
  ${WORKBOOK}

Use Node.js to read cell A1 (Row 1, Column 1) from each of the following sheets:
  - Vendor Analysis Assessment
  - Top 3 Opportunities
  - Methodology
  - CEOCFO Recommendations

Node.js pattern:
  node -e "
    const XLSX = require('xlsx');
    const wb = XLSX.readFile('${WORKBOOK}');
    const sheets = ['Vendor Analysis Assessment','Top 3 Opportunities','Methodology','CEOCFO Recommendations'];
    sheets.forEach(name => {
      const ws = wb.Sheets[name];
      if (ws) {
        const cell = ws['A1'];
        console.log(name + ' A1:', cell ? cell.v : '(empty)');
      } else {
        console.log(name + ': sheet not found');
      }
    });
  "

Report the content of A1 for each sheet.
Identify any template instructions, constraints, word limits, or structural requirements.
These constraints govern all output generated in subsequent steps and take precedence over workflow defaults.
Do NOT overwrite cell A1 in any sheet.
<!-- /STEP:02 -->

---

<!-- STEP:03 -->
You are a vendor spend analyst.

Read all vendor rows from the 'Vendor Analysis Assessment' sheet in:
  ${WORKBOOK}

Node.js read:
  node -e "
    const XLSX = require('xlsx');
    const wb = XLSX.readFile('${WORKBOOK}');
    const ws = wb.Sheets['Vendor Analysis Assessment'];
    const data = XLSX.utils.sheet_to_json(ws);
    console.log(JSON.stringify(data, null, 2));
  "

From this data, calculate and report:

1. Total vendor count
2. Total 12-month spend (sum of all 'Last 12 months Cost (USD)' values)
3. Top 10 vendors by spend (name + cost + % of total)
4. Spend concentration: what % of total spend is held by the top 10 vendors
5. Long-tail vendors (spend < $50,000): list names and costs
6. High-spend strategic vendors (spend > $200,000): list names and costs

Format output as a clearly structured report.
This analysis will inform opportunity identification in Step 09.
<!-- /STEP:03 -->

---

<!-- STEP:04 -->
You are a senior vendor strategist with deep knowledge of the enterprise SaaS and services market.

Read all vendor rows from the 'Vendor Analysis Assessment' sheet in:
  ${WORKBOOK}

Node.js read:
  node -e "
  const XLSX = require('xlsx');
  const wb = XLSX.readFile('${WORKBOOK}');
  const ws = wb.Sheets['Vendor Analysis Assessment'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  const vendors = rows.map(v => ({
    name: v['Vendor Name'],
    spend: v['Last 12 months Cost (USD)']
  }));
  console.log(JSON.stringify(vendors, null, 2));
  "
For each vendor, determine:
  1. Service Category (internal classification):
     Cloud Infrastructure | Data Platforms | Security | Marketing Automation | CRM |
     Developer Tools | Analytics | Facilities | Legal Services | Recruiting |
     Productivity SaaS | Professional Services | Finance | Other

  2. Department (from allowed list only):
     Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
     Professional Services | Sales | Support | Finance

Classification guidance:
  - AWS / Azure / GCP              → Engineering (Cloud Infrastructure)
  - Salesforce / HubSpot CRM       → Sales (CRM)
  - Workday / BambooHR / Gusto     → G&A (HR)
  - WeWork / Regus                 → Facilities
  - Stripe / NetSuite / QuickBooks → Finance
  - Datadog / Splunk               → Engineering (Monitoring / Security)
  - Marketo / HubSpot Marketing    → Marketing (Marketing Automation)
  - Deloitte / KPMG / PwC / EY    → M&A (if transaction advisory)
  - Okta / CrowdStrike / Snyk      → Engineering (Security)
  - Slack / Notion / Zoom          → G&A (Productivity SaaS)
  - Intercom / Zendesk             → Support
  - Carta / Pulley                 → Finance (equity management)
  - LinkedIn (recruiting)          → G&A
  - Upwork / Toptal                → G&A (Freelance Marketplace)

Print a classification table: Vendor Name | Service Category | Department | Spend

<!-- /STEP:04 -->

---

<!-- STEP:05 -->
You are a vendor spend analyst with deep knowledge of the enterprise software industry.

Your task is to determine classification values for each vendor listed in the worksheet:

Vendor Analysis Assessment

Workbook:
${WORKBOOK}

Do NOT modify the Excel workbook.

Do NOT modify these columns:
• Vendor Name
• Last 12 months Cost (USD)

Determine values for the following columns:

• Department
• 1-line Description on what the Vendor does
• Suggestions (Consolidate / Terminate / Optimize costs)

------------------------------------------------------------

ALLOWED Department values (use EXACTLY these):

Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product | Professional Services | Sales | Support | Finance | Unknown

ALLOWED Suggestions values:

Optimize | Consolidate | Terminate

------------------------------------------------------------

Suggestions recommendation heuristics:

Terminate  
• vendor spend < $50K  
• redundant service  
• non-core long-tail vendor  

Consolidate  
• duplicate vendor categories  
• overlapping SaaS tools  

Optimize  
• strategic SaaS or infrastructure vendor  
• vendor spend > $200K  
• renegotiation or license optimization opportunity  

------------------------------------------------------------

STEP A — Read vendor data

Use Node.js to read vendor names and spend values from the worksheet.

node -e "
const XLSX=require('xlsx');
const wb=XLSX.readFile('${WORKBOOK}');
const ws=wb.Sheets['Vendor Analysis Assessment'];

const vendors = XLSX.utils.sheet_to_json(ws)
  .map(v => ({
    name: v['Vendor Name'],
    spend: v['Last 12 months Cost (USD)']
  }));

console.log(JSON.stringify(vendors,null,2));
"

------------------------------------------------------------

STEP B — Handle blank vendor names

If Vendor Name is blank:

Vendor Name → Unknown  
Department → Unknown  
1-line Description on what the Vendor does → Unknown  
Suggestions (Consolidate / Terminate / Optimize costs) → Unknown  

Treat "Unknown" vendors as informational records only and exclude them from optimization opportunity analysis.

Skip STEP C and STEP D for these vendors.

------------------------------------------------------------

STEP C — Pre-classify obvious cases

If vendor spend is less than $50,000:

• Suggestions → Terminate  
• Department → G&A (default for non-core services unless clearly associated with another department)

These vendors typically represent long-tail services and do not require deep analysis.

Only vendors with spend ≥ $50,000 should be fully analyzed.

------------------------------------------------------------

STEP D — Determine values for the worksheet columns

For vendors with spend ≥ $50,000 determine values for:

• Department  
• 1-line Description on what the Vendor does  
• Suggestions (Consolidate / Terminate / Optimize costs)

Description should be concise (~120 characters).

Suggestions must be one of:

Optimize | Consolidate | Terminate | Unknown

Use industry knowledge of widely known vendors when determining service category.

If vendor identity or category is uncertain, infer the most likely service based on industry knowledge rather than defaulting to generic SaaS categories.

Do not invent vendors or modify vendor names.  
Use the exact vendor names provided in the worksheet.

Do NOT modify the Excel workbook directly.  
Only determine the values for the columns listed above.

------------------------------------------------------------

STEP E — Output format

CRITICAL OUTPUT RULES

• Output MUST be valid JSON.
• Do NOT include explanations, summaries, headings, markdown, or commentary.
• The first character of the response must be '['
• The last character must be ']'

Return ONLY the JSON array.

The response MUST start with '[' and end with ']'.

Do NOT include:
- explanations
- commentary
- markdown
- code fences
- text before or after the JSON

Each object must contain exactly these keys:

Vendor Name
Department
Description
Suggestion

Example structure:

[
  {
    "Vendor Name": "Salesforce Uk Ltd-Uk",
    "Department": "Sales",
    "Description": "CRM platform used to manage sales pipeline, customer relationships and revenue forecasting",
    "Suggestion": "Optimize"
  },
  {
    "Vendor Name": "Amazon Web Services Llc",
    "Department": "Engineering",
    "Description": "Cloud infrastructure provider offering compute, storage, databases and networking services",
    "Suggestion": "Optimize"
  }
]
<!-- /STEP:05 -->

---

<!-- STEP:06 -->
You are a vendor strategy analyst.

Read the populated 'Vendor Analysis Assessment' sheet from:
  ${WORKBOOK}

Node.js read:
  node -e "const XLSX=require('xlsx'); const wb=XLSX.readFile('${WORKBOOK}'); const ws=wb.Sheets['Vendor Analysis Assessment']; console.log(JSON.stringify(XLSX.utils.sheet_to_json(ws)));"

For each vendor, produce a concise rationale for the assigned recommendation.

Rationale must reference:
  - Vendor spend level relative to thresholds ($50K / $200K)
  - Category overlap or duplication (if Consolidate)
  - Strategic importance (if Optimize)
  - Redundancy or low value (if Terminate)

Print the rationale as a structured report:
  Vendor Name | Recommendation | Rationale (1–2 sentences)

This output will be used to validate recommendation quality in Step 13.
<!-- /STEP:06 -->

---

<!-- STEP:07 -->
You are a vendor strategy analyst.

Read the populated 'Vendor Analysis Assessment' sheet from:
  ${WORKBOOK}

Node.js read:
  node -e "const XLSX=require('xlsx'); const wb=XLSX.readFile('${WORKBOOK}'); const ws=wb.Sheets['Vendor Analysis Assessment']; console.log(JSON.stringify(XLSX.utils.sheet_to_json(ws)));"

From the vendor data:
1. Group vendors by service category (e.g. CRM, Monitoring, Productivity, Workspace, Marketing Automation).
2. Identify categories where multiple vendors perform overlapping or identical functions.
3. For each duplicate category, calculate the combined spend.
4. Rank duplicate categories by combined spend (highest impact first).
5. Flag specific vendors that are strong consolidation candidates.

Print output as:
  Category | Vendors in Category | Combined Spend | Consolidation Candidate(s)

This analysis informs Step 09 (opportunity identification).
<!-- /STEP:07 -->

---

<!-- STEP:08 -->
You are a senior vendor strategist.

Read the populated 'Vendor Analysis Assessment' sheet from:
  ${WORKBOOK}

Node.js read:
  node -e "const XLSX=require('xlsx'); const wb=XLSX.readFile('${WORKBOOK}'); const ws=wb.Sheets['Vendor Analysis Assessment']; console.log(JSON.stringify(XLSX.utils.sheet_to_json(ws)));"

For each vendor, evaluate strategic importance using these factors:
  - Role in product or platform infrastructure (high weight)
  - Customer-facing capabilities (high weight)
  - Operational criticality (high weight)
  - Redundancy or overlap with other vendors (negative weight)
  - Spend level (high spend = higher strategic importance)

Assign a Strategic Score (1–5):
  5 = Mission critical, cannot be replaced
  4 = Strategic, significant switching cost
  3 = Important but substitutable
  2 = Marginal value, overlap exists
  1 = Redundant or low-value

Use the strategic score to validate recommendation alignment:
  Score 4–5 → should be Optimize
  Score 2–3 → evaluate for Consolidate
  Score 1   → Terminate is appropriate

Flag any vendors where the current recommendation conflicts with the strategic score.

Print:
  Vendor Name | Score | Current Recommendation | Score-Aligned Recommendation | Conflict (Y/N)
<!-- /STEP:08 -->

---

<!-- STEP:09 -->
You are a vendor spend strategist.

Read the current state of the workbook at:
  ${WORKBOOK}

Node.js — read Vendor Analysis Assessment:
  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');
    const ws=wb.Sheets['Vendor Analysis Assessment'];
    console.log(JSON.stringify(XLSX.utils.sheet_to_json(ws)));
  "

Also read the template instructions from the 'Top 3 Opportunities' sheet (A1):

  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');
    const ws=wb.Sheets['Top 3 Opportunities'];
    if (ws && ws['A1']) console.log('Template A1:', ws['A1'].v);
    else console.log('A1: empty');
  "

Identify the THREE highest-impact cost optimization opportunities based on:

• Highest-spend vendors (prioritize by absolute USD value)  
• Consolidation candidates (combined category spend × 15–20% savings)  
• Terminate candidates (termination-eligible spend × 90% recovery)  
• SaaS license optimization (15–30% of license spend)  
• Contract renegotiation (10–15% of strategic vendor spend)

For each opportunity produce:

Title  
  concise, specific (e.g. "Renegotiate AWS Enterprise Contract")

Explanation  
  2–4 sentences explaining why this opportunity is high impact,
  the action required, and the expected savings mechanism.

Estimated Annual Savings (USD)  
  calculated using the benchmark ranges below and the actual vendor spend.

Savings benchmarks:

Renegotiate / right-size:      10–15% of vendor spend  
SaaS license optimization:     15–30% of license spend  
Vendor consolidation:          15–20% of combined category spend  
Vendor termination:            90% of terminate-eligible spend

Prioritize opportunities by **highest estimated annual savings**.

Return EXACTLY THREE opportunities.

------------------------------------------------------------

WRITE RESULTS TO EXCEL

Update the worksheet:

  Top 3 Opportunities

Node.js write pattern:

1. Read the worksheet.
2. Locate the header row.
3. Identify the columns:

   Opportunity Title  
   Explanation  
   Estimated Annual Savings (USD)

4. If the column **Estimated Annual Savings (USD)** does not exist,
   create it as the next column after **Explanation**.

5. Write the three opportunities to the rows below the header.

IMPORTANT:

• Do NOT recreate or overwrite the worksheet.  
• Do NOT use XLSX.utils.aoa_to_sheet.  
• Only update the required cells beneath the header rows.  
• Preserve existing formatting, column widths, and styles.  
• Preserve the instruction cell (A1).
• Preserve the first row (column headers) and first column (row labels).

------------------------------------------------------------

After writing the results, print confirmation:

Opportunity Title | Estimated Annual Savings (USD)

for the three opportunities written to the worksheet.

<!-- /STEP:09 -->

---

<!-- STEP:10 -->
You are a vendor spend analyst recording analysis metrics for audit purposes.

Read the populated 'Vendor Analysis Assessment' sheet from:
  ${WORKBOOK}

Node.js read:
  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');
    const vendors=XLSX.utils.sheet_to_json(wb.Sheets['Vendor Analysis Assessment']);
    const opps=XLSX.utils.sheet_to_json(wb.Sheets['Top 3 Opportunities']);
    console.log('VENDORS:', JSON.stringify(vendors));
    console.log('OPPORTUNITIES:', JSON.stringify(opps));
  "

Calculate and print the following metrics for the execution log:

1. Total vendor spend (sum of all 'Last 12 months Cost (USD)')
2. Top 5 vendors by spend (name + spend + % of total)
3. Spend concentration: top 10 vendors as % of total spend
4. Long-tail vendor count (spend < $50,000) and their combined spend
5. Number of duplicate vendor categories detected (categories with 2+ vendors)
6. Vendor strategic scoring summary: count of vendors by score band (5, 4, 3, 2, 1)
7. Recommendation distribution: count of Optimize / Consolidate / Terminate
8. Total identified annual savings across Top 3 Opportunities

Format as a structured metrics report. These metrics are for log traceability only — do not write them to the Excel workbook.
<!-- /STEP:10 -->

---

<!-- STEP:11 -->
You are a vendor strategy analyst documenting the analytical methodology.

First, read the template instructions from the Methodology sheet (A1) in:
  ${WORKBOOK}

Then write a structured methodology into the 'Methodology' sheet.

The methodology must cover these stages:
  1. Data Review — how vendor spend data was sourced and reviewed
  2. Spend Concentration Analysis — how top vendors and long-tail were identified
  3. Vendor Categorization — how service categories and departments were assigned
  4. Service Overlap Identification — how duplicate categories were detected
  5. Cost Optimization Framework — the Terminate / Consolidate / Optimize decision rules
  6. Opportunity Prioritization — how the top 3 opportunities were selected

IMPORTANT CONSTRAINTS:
  - Do NOT mention: Claude Code CLI, prompts, scripts, automation, or AI tools
  - Write as if produced by an operations consulting team performing manual due diligence
  - Tone: professional, structured, executive-appropriate
  - Comply with any template instructions found in A1 (word limits, format, etc.)

Write to the Methodology sheet using Node.js.

IMPORTANT:

• Do NOT recreate or overwrite the worksheet.  
• Do NOT use XLSX.utils.aoa_to_sheet.  
• Only update the required cells beneath the header rows.  
• Preserve existing formatting, column widths, and styles.  
• Preserve the instruction cell (A1).
• Preserve the first row (column headers) and first column (row labels).

<!-- /STEP:11 -->

---

<!-- STEP:12 -->
You are a vendor strategy director writing an executive memo to the CEO and CFO.

Read all data from the workbook at:
  ${WORKBOOK}

Node.js — read vendor data:
  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');
    const vendors=XLSX.utils.sheet_to_json(wb.Sheets['Vendor Analysis Assessment']);
    const opps=XLSX.utils.sheet_to_json(wb.Sheets['Top 3 Opportunities']);
    console.log('VENDORS:', JSON.stringify(vendors));
    console.log('OPPORTUNITIES:', JSON.stringify(opps));
  "

Also read the template instructions from the CEOCFO Recommendations sheet (A1):
  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');
    const ws=wb.Sheets['CEOCFO Recommendations'];
    if (ws && ws['A1']) console.log('CEOCFO A1:', ws['A1'].v);
    else console.log('A1: empty');
  "

Write a concise executive memo to 'CEOCFO Recommendations' with these sections:

  MEMORANDUM
  TO:   Chief Executive Officer | Chief Financial Officer
  FROM: Vendor Strategy & Procurement
  DATE: March 2026
  RE:   Vendor Spend Strategy — Cost Optimisation Recommendations

  1. VENDOR SPEND OVERVIEW
     - Total vendor count and 12-month spend
     - Breakdown: how many vendors to Optimize / Consolidate / Terminate and their combined spend
     - Top spend concentration (e.g. top 10 vendors = X% of total spend)

  2. MAJOR COST DRIVERS
     - Top 3–5 vendors driving spend concentration
     - Departments with highest aggregate spend

  3. TOP 3 COST REDUCTION OPPORTUNITIES
     - List from Top 3 Opportunities sheet with titles and savings estimates

  4. ESTIMATED SAVINGS SUMMARY
     - Total identified annual savings (USD)
     - Savings as % of total annual vendor spend
     - Conservative first-year realisation estimate (50–70% of identified savings)

  5. IMPLEMENTATION ROADMAP
     Month 1–2:  Terminate low-value vendor contracts at next renewal
     Month 2–4:  Consolidate duplicate tool categories; migrate to preferred platform
     Month 3–6:  Renegotiate strategic vendor contracts with benchmarking data
     Month 6+:   Establish quarterly vendor review cadence and spend monitoring dashboard

  6. RISKS AND MITIGATIONS
     - Operational disruption from tool consolidation → phased migration plan
     - Contract lock-in and early termination penalties → align to renewal windows
     - Savings realisation delay due to migration costs → net savings model
     - Stakeholder resistance from business unit owners → executive sponsorship required

Tone: executive, data-driven, concise. Use actual numbers from the workbook data.
Comply with any template instructions found in CEOCFO Recommendations A1.

Write to the sheet using Node.js starting from row 2. Preserve instruciton cell(A1).

IMPORTANT:

• Do NOT recreate or overwrite the worksheet.  
• Do NOT use XLSX.utils.aoa_to_sheet.  
• Only update the required cells beneath the header rows.  
• Preserve existing formatting, column widths, and styles.  
• Preserve the instruction cell (A1).
• Preserve the first row (column headers) and first column (row labels).

<!-- /STEP:12 -->

---

<!-- STEP:13 -->
You are a data quality analyst.

Read all rows from the 'Vendor Analysis Assessment' sheet in:
  ${WORKBOOK}

  node -e "const XLSX=require('xlsx'); const wb=XLSX.readFile('${WORKBOOK}'); const ws=wb.Sheets['Vendor Analysis Assessment']; console.log(JSON.stringify(XLSX.utils.sheet_to_json(ws)));"

For every vendor row, validate:
  1. Department is populated AND is one of:
     Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
     Professional Services | Sales | Support | Finance | Unknown
  2. '1-line Description on what the Vendor does' is non-empty
  3. 'Suggestions (Consolidate / Terminate / Optimize costs)' is one of:
     Optimize | Consolidate | Terminate

Print a validation report:
  PASS: vendor name — all fields valid
  FAIL: vendor name — field(s) that failed and reason

If any rows FAIL:

  - Determine corrected values for the affected fields.
  - Update ONLY the specific cells that require correction.
  - Only repair the rows that failed validation.
  - Do NOT regenerate classifications for rows that already contain valid values.

IMPORTANT:

• Do NOT recreate or overwrite the worksheet.  
• Do NOT use XLSX.utils.aoa_to_sheet.  
• Only update the required cells beneath the header rows.  
• Preserve existing formatting, column widths, and styles.  
• Preserve the instruction cell (A1).
• Preserve the first row (column headers) and first column (row labels).

Write the corrected values back to the workbook via Node.js and report each correction made.

Print final summary:
  Total rows validated : X
  Passed              : X
  Failed and corrected : X

Also confirm:
  - Top 3 Opportunities sheet is populated
  - Methodology sheet has content
  - CEOCFO Recommendations sheet has content
<!-- /STEP:13 -->

---

<!-- STEP:14 -->
You are a senior vendor strategy analyst performing a final quality review.

Read all populated sheets from:
  ${WORKBOOK}

  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');
    const vendors=XLSX.utils.sheet_to_json(wb.Sheets['Vendor Analysis Assessment']);
    const opps=XLSX.utils.sheet_to_json(wb.Sheets['Top 3 Opportunities']);
    console.log('Vendors:', JSON.stringify(vendors));
    console.log('Opportunities:', JSON.stringify(opps));
  "

Perform a critical second-pass review:

DEPARTMENT ACCURACY — Common corrections to apply if found:
  - Stripe / NetSuite / QuickBooks → Finance (not Engineering or SaaS)
  - Workday / BambooHR / Gusto    → G&A (not Finance)
  - Intercom / Zendesk            → Support (not Marketing)
  - LinkedIn                      → G&A (recruiting context) or Marketing (ads context)
  - Okta / CrowdStrike / Snyk     → Engineering (security)
  - Deloitte / KPMG / PwC / EY   → M&A (if transaction advisory)
  - Carta / Pulley                → Finance (equity management)

RECOMMENDATION ACCURACY:
  - If two vendors serve the same function, at least one must be Consolidate
  - Core infrastructure (AWS, Azure, GCP) should be Optimize, never Terminate
  - Freelance marketplaces (Upwork, Toptal) should be Terminate
  - Low-spend (<$50K) non-core vendors should be Terminate

TOP 3 OPPORTUNITIES REVIEW:
  - Verify savings estimates are based on actual spend numbers
  - Confirm each opportunity addresses a high-spend category or vendor
  - Replace any opportunity with a higher-impact alternative if identified

Apply all corrections via Node.js writes.

Print a review summary: each correction made and the reason for it.

If no corrections are needed, state that explicitly.

<!-- /STEP:14 -->

---

<!-- STEP:15 -->
You are a senior analyst performing a confidence assessment before final save.

Read the final state of 'Vendor Analysis Assessment' from:
  ${WORKBOOK}

  node -e "const XLSX=require('xlsx'); const wb=XLSX.readFile('${WORKBOOK}'); const ws=wb.Sheets['Vendor Analysis Assessment']; console.log(JSON.stringify(XLSX.utils.sheet_to_json(ws)));"

For each vendor, assign a confidence level:
  HIGH   — vendor identity is well-known; classification is unambiguous
  MEDIUM — vendor identity is recognisable; classification is reasonable but not certain
  LOW    — vendor name is unfamiliar, ambiguous, or too generic to classify with confidence

Print a confidence report:
  Vendor Name | Confidence | Reason if MEDIUM or LOW

Flag all LOW-confidence vendors for human review before finalisation.

Also verify:
  - All HIGH-impact Terminate or Consolidate recommendations have strong, specific justification
  - No strategic vendor (cloud infrastructure, core CRM, security) is marked Terminate
  - All major Consolidate recommendations identify the specific overlap or duplication
  - All Optimize recommendations identify the specific renegotiation or right-sizing lever


Report:
  HIGH confidence vendors   : X
  MEDIUM confidence vendors : X
  LOW confidence vendors    : X (flagged for human review)

State whether the workbook is READY TO SAVE or whether human review is recommended first.

<!-- /STEP:15 -->

---

<!-- STEP:16 -->
Perform a final read and confirmation of all four sheets in the workbook at:
  ${WORKBOOK}

Node.js — summarise each sheet:
  node -e "
    const XLSX=require('xlsx');
    const wb=XLSX.readFile('${WORKBOOK}');

    // Vendor Analysis Assessment
    const vendors=XLSX.utils.sheet_to_json(wb.Sheets['Vendor Analysis Assessment']);
    console.log('=== Vendor Analysis Assessment ===');
    console.log('Total rows:', vendors.length);
    console.log('Sample (first 3):', JSON.stringify(vendors.slice(0,3), null, 2));

    // Top 3 Opportunities
    const opps=XLSX.utils.sheet_to_json(wb.Sheets['Top 3 Opportunities']);
    console.log('=== Top 3 Opportunities ===');
    opps.forEach((o,i) => console.log((i+1)+'.', JSON.stringify(o)));

    // Methodology
    const meth=XLSX.utils.sheet_to_json(wb.Sheets['Methodology'], {header:1});
    console.log('=== Methodology (first 3 rows) ===');
    meth.slice(0,3).forEach(r => console.log(r));

    // CEOCFO Recommendations
    const memo=XLSX.utils.sheet_to_json(wb.Sheets['CEOCFO Recommendations'], {header:1});
    console.log('=== CEOCFO Recommendations (first 3 rows) ===');
    memo.slice(0,3).forEach(r => console.log(r));

    // Spend summary
    const totalSpend=vendors.reduce((s,v)=>s+(parseFloat(String(v['Last 12 months Cost (USD)']||0).replace(/[^0-9.]/g,''))||0),0);
    const byRec={'Optimize':0,'Consolidate':0,'Terminate':0};
    vendors.forEach(v=>{ const r=v['Suggestions (Consolidate / Terminate / Optimize costs)']; if(byRec[r]!==undefined) byRec[r]++; });
    console.log('=== Spend Summary ===');
    console.log('Total vendors:', vendors.length);
    console.log('Total spend: \$'+totalSpend.toLocaleString());
    console.log('By recommendation:', JSON.stringify(byRec));

    const totalSavings=opps.reduce((s,o)=>s+(parseFloat(String(o['Estimated Annual Savings (USD)']||0).replace(/[^0-9.]/g,''))||0),0);
    console.log('Total identified savings: \$'+totalSavings.toLocaleString());
  "

The workbook is already saved at each write step.
Confirm the file exists and is accessible at:
  ${WORKBOOK}

Print: 'Assessment complete. Output saved to: ${WORKBOOK}'
<!-- /STEP:16 -->
