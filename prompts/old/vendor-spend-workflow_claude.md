# Vendor Spend Strategy Assessment — AI-Orchestrated Workflow

## Purpose
This workflow operationalizes vendor spend due diligence using Claude Code CLI.
It converts a manual spreadsheet-based analysis into a repeatable AI-enabled process
that assesses vendor portfolios and identifies cost optimization opportunities.

It is read by `scripts/vendor_rationalization.sh`, which extracts each step's prompt
and passes it to Claude Code CLI via stdin pipe (printf "%s" "$prompt" | claude).

Each step is delimited by `<!-- STEP:N -->` and `<!-- /STEP:N -->` markers.
The script substitutes `${WORKBOOK}` with the absolute workbook path before execution.

## Role

You are a VP of Operations with experience and expertise in vendor spend rationalisation for technology companies.

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

---

<!-- STEP:01 -->
You are performing STEP 01 of the Vendor Spend Strategy assessment.

TASK: Inspect workbook structure.

The workbook is located at: ${WORKBOOK}

Open the workbook and confirm the following sheets are present:
- Vendor Analysis Assessment
- Top 3 Opportunities
- Methodology
- CEOCFO Recommendations

Report any missing sheets.

In the Vendor Analysis Assessment sheet, confirm the following columns exist:
- Vendor Name
- Last 12 months Cost (USD)

These columns must NOT be modified.

Print a summary of sheets found, columns confirmed, total vendor row count,
and the first 3 vendor names and costs.

<!-- /STEP:01 -->

---

<!-- STEP:02 -->
You are performing STEP 02 of the Vendor Spend Strategy assessment.

TASK: Read template instruction constraints from every worksheet.

The workbook is located at: ${WORKBOOK}

Read cell A1 in every sheet in the workbook. These cells contain embedded instructions
governing structure, format, word limits, and output constraints for that sheet.

Report the full A1 content for every sheet.
Summarise any constraints that will affect how outputs must be formatted in later steps.
Where template instructions conflict with workflow guidance, template instructions take precedence.
Do not modify anything.
<!-- /STEP:02 -->

---

<!-- STEP:03 -->
You are performing STEP 03 of the Vendor Spend Strategy assessment.

TASK: Perform vendor spend analysis.

The workbook is located at: ${WORKBOOK}

Read all rows from the Vendor Analysis Assessment sheet.
From this data, calculate and report:

1. Total vendor count
2. Total 12-month spend (sum of all 'Last 12 months Cost (USD)' values)
3. Top 10 vendors by spend (name + cost + % of total)
4. Spend concentration: what % of total spend is held by the top 10 vendors
5. Long-tail vendors (spend < $50,000): count only — do not list individual vendors
6. High-spend strategic vendors (spend > $200,000): list names and costs

Format output as a clearly structured report. Do not write any files - this output is for execution log only.
<!-- /STEP:03 -->

---

<!-- STEP:04 -->
You are performing STEP 04 of the Vendor Spend Strategy assessment.

TASK: Classify vendor categories and assign departments.

The workbook is located at: ${WORKBOOK}

Read all vendor names and spend amounts from the Vendor Analysis Assessment sheet IN ONE READ — do not re-read the sheet.

CRITICAL — Vendor Name accuracy:
Copy each vendor name character-for-character from the spreadsheet into all outputs.
Do not retype from memory. Do not change capitalisation, punctuation, spacing, or spelling.
Any deviation will cause that vendor to be silently skipped in the workbook write-back step,
leaving that row blank in the final output.

Using your deep knowledge of the enterprise SaaS and services market,
classify ALL vendors in a SINGLE PASS — output the full table immediately without
pausing to reason through individual vendors one at a time.

Assign each vendor:
1. Service category (one of):
   Cloud Infrastructure | CRM | Security | Marketing Automation | Data Platforms |
   Developer Tools | Analytics | Facilities | Legal Services | Recruiting |
   Productivity SaaS | Professional Services | Insurance | Travel | Accounting | Finance | Other

2. Exactly ONE department from:
   Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
   Professional Services | Sales | Support | Finance

Classification reference (apply instantly, do not deliberate):
  AWS / Azure / GCP              → Engineering, Cloud Infrastructure
  Salesforce / HubSpot CRM       → Sales, CRM
  Workday / BambooHR / Gusto     → G&A, HR
  WeWork / Regus / IWG           → Facilities, Facilities
  Stripe / NetSuite / QuickBooks → Finance, Accounting
  Datadog / Splunk / New Relic   → Engineering, Monitoring
  Marketo / HubSpot Marketing    → Marketing, Marketing Automation
  Deloitte / KPMG / PwC / EY    → M&A, Professional Services
  Okta / CrowdStrike / Snyk      → Engineering, Security
  Slack / Notion / Zoom / Teams  → G&A, Productivity SaaS
  Intercom / Zendesk / Freshdesk → Support, Support
  Carta / Pulley / Capdesk       → Finance, Finance
  LinkedIn / Indeed              → G&A, Recruiting
  Upwork / Toptal / Fiverr       → G&A, Professional Services

Rules:
- ONE pass only. Do not retry, loop, or patch after producing the table.
- If vendor is unidentifiable → G&A, Other.
- If Vendor Name is blank → Unknown, Unknown.
- Do not leave any vendor unclassified.

Output a pipe-delimited table:
  Vendor Name | Spend | Category | Department

Do not write any files — this output is for the execution log only.

<!-- /STEP:04 -->

---

<!-- STEP:05 -->
You are performing STEP 05 of the Vendor Spend Strategy assessment.

TASK: Produce a JSON classification array for all vendors and write it to a file.

The workbook is located at: ${WORKBOOK}

STEP 1 — Use Step 04 output directly
The classification table from Step 04 already contains every vendor's exact name (copied
verbatim from the workbook), Category, and Department. Use those values as-is.
Do NOT re-read the workbook for vendor names. Do NOT re-classify anything.
Do NOT re-reason about categories or departments.

CRITICAL: The vendor names in the Step 04 table are the authoritative exact-match strings.
Use them character-for-character. The workbook write-back is case-sensitive and exact-match only.

STEP 3 — Add Description and Suggestion for each vendor
Your only new work in this step is adding these two fields:

Using your deep knowledge of the enterprise SaaS and services market, determine the most appropriate Description and Suggestion for each vendor:

- **Description**: A single concise sentence (max 120 characters) describing what the vendor does.

- **Suggestion**: Exactly one of: Terminate | Consolidate | Optimize

  Suggestion recommendation logic:
  - **Terminate**: Low-spend vendors (< $50K), redundant services, non-core long-tail vendors with minimal strategic value
  - **Consolidate**: Duplicate vendors in the same category, overlapping SaaS products or services, or mid-spend vendors ($50K - $200K) with no clear strategic differentiation
  - **Optimize**: Strategic SaaS or infrastructure vendor with spend above $200K where contract renegotiation or license optimization can generate savings

- If Vendor Name is blank, assign as follows:
  Department=Unknown, Description=Unknown, Suggestion=Unknown
  
  Treat these as informational records only, exclude them from
  optimization opportunity analysis in Step 09, and flag for
  human review to identify the vendor before any action is taken.

STEP 4 — Produce output JSON
Output only a valid JSON array containing every vendor. Do not truncate. No markdown fences:

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
    "Vendor Name": "Zoom Video Communications",
    "Department": "G&A",
    "Description": "Video conferencing and collaboration platform for remote meetings and webinars",
    "Suggestion": "Terminate"
  }
]

Note: Suggestion must be one of: Terminate | Consolidate | Optimize | Unknown

STEP 5 — Write to file
Write the JSON array to outputs/step05_vendors.json by running a Node.js command via the Bash tool. 

Print the full path and confirm JSON_WRITTEN_OK records:[count] before proceeding.
<!-- /STEP:05 -->

---

<!-- STEP:06 -->
You are performing STEP 06 of the Vendor Spend Strategy assessment.

TASK: Capture decision rationale for each recommendation.

Do NOT re-read the workbook. Use the vendor data already in context from Step 05
(vendor name, spend, department, suggestion). This avoids an unnecessary 386-row
file read that duplicates work already done.

Using your expertise in vendor strategy and procurement, produce rationale for each
vendor in ONE pass — do not deliberate vendor by vendor:

Apply these rules mechanically:
- Terminate  → spend < $50K or redundant: state the spend and why it's non-core
- Consolidate → duplicate category or $50K–$200K with overlap: name the overlap
- Optimize   → spend > $200K strategic: state the renegotiation lever
- Unknown    → blank vendor name: flag for human review

Print the rationale as a structured report (one line per vendor):
  Vendor Name | Recommendation | Rationale (1 sentence max)

This log is for auditability only. Do not write any files — execution log only.
<!-- /STEP:06 -->

---

<!-- STEP:07 -->
You are performing STEP 07 of the Vendor Spend Strategy assessment.

TASK: Detect duplicate vendor categories and consolidation opportunities.

Do NOT re-read the workbook. The vendor names, spend, departments, and service
categories are already in context from Steps 04 and 05. Use those directly.

Using your expertise in vendor strategy and enterprise SaaS market dynamics,
group vendors by the service categories assigned in Step 04 and identify
consolidation opportunities in ONE pass:

1. Group vendors by service category.
2. Flag categories with 2+ vendors as consolidation candidates.
3. For each flagged category, sum the combined spend.
4. Rank by combined spend (highest first).
5. Recommend which vendor to retain and which to consolidate away.

Output as a pipe-delimited table:
  Category | Vendors in Category | Combined Spend | Consolidation Candidate(s)

This output is for the execution log only. Do not write any files.
<!-- /STEP:07 -->

---

<!-- STEP:08 -->
You are performing STEP 08 of the Vendor Spend Strategy assessment.

TASK: Score vendors by strategic importance and refine recommendations.

The workbook is located at: ${WORKBOOK}

Read the populated 'Vendor Analysis Assessment' sheet.

Using your expertise in enterprise technology, operational strategy and vendor strategy,
evaluate each vendor's strategic importance to the business.
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

Print ONLY vendors where Conflict = Y:
  Vendor Name | Score | Current Recommendation | Score-Aligned Recommendation | Conflict (Y/N)

For vendors with no conflict, report only the count by score band (5, 4, 3, 2, 1).
This output is for the execution log only. Do not write any files.
<!-- /STEP:08 -->

---

<!-- STEP:09 -->
You are performing STEP 09 of the Vendor Spend Strategy assessment.

TASK: Identify the top 3 cost optimization opportunities and write them to the workbook.

The workbook is located at: ${WORKBOOK}

Do NOT re-read the Vendor Analysis Assessment sheet — all vendor data is already
in context from Steps 03–08. You have total spend, vendor list, categories,
scores, and consolidation analysis already. Use that data directly.

Read ONLY the Top 3 Opportunities sheet from ${WORKBOOK} to check A1 template
instructions and existing column structure. Do not overwrite A1.

Using your expertise in vendor cost optimisation and procurement strategy,
identify the three highest-impact cost reduction opportunities from the
analysis already completed in Steps 03–08, prioritising:
- Highest-spend vendors (prioritize by absolute USD value)
- High-spend vendor renegotiation (benchmark: 10–15% savings)
- SaaS license optimization and right-sizing (benchmark: 15–30% savings)
- Vendor consolidation opportunities (benchmark: 15–20% savings)
- Long-tail vendor termination (benchmark: 10–20% of terminate-eligible spend,
  accounting for notice periods, minimum commitments, and renewal timing)

For each opportunity, write:
Title
  Concise and specific (e.g. "Renegotiate Salesforce Enterprise Contract")

Explanation
  3 bullet points maximum, each bullet maximum 12 words:
  - What the problem is
  - What action to take
  - Expected outcome or saving mechanism

Estimated Annual Savings (USD)
  Calculated using the benchmark ranges below and actual vendor spend.

Savings benchmarks:
  Renegotiate / right-size:      10–15% of vendor spend
  SaaS licence optimisation:     15–30% of licence spend
  Vendor consolidation:          15–20% of combined category spend
  Vendor termination:            10–20% of terminate-eligible spend

Prioritise opportunities by highest estimated annual savings.
Return EXACTLY THREE opportunities.

Write the three opportunities to the Top 3 Opportunities sheet:
- Update only Opportunity Title, Explanation, and Estimated Annual Savings cells
- Write to rows 2, 3, and 4 only
- If Estimated Annual Savings column does not exist, add it — only permitted column addition
- Use encode_cell to write individual cells. Do not rebuild the sheet

IMPORTANT:
- Do NOT recreate or overwrite the worksheet
- Do NOT use aoa_to_sheet
- Only update the required cells beneath the header row
- Preserve the instruction cell A1
- Preserve existing column headers

After writing print confirmation:
  Opportunity Title | Estimated Annual Savings (USD)
for the three opportunities written to the worksheet.
<!-- /STEP:09 -->

---

<!-- STEP:10 -->
You are performing STEP 10 of the Vendor Spend Strategy assessment.

TASK: Record analysis metrics for the audit trail.

Do NOT re-read the Vendor Analysis Assessment sheet or the Top 3 Opportunities sheet.
All required data is already in context from previous steps:
- Total spend, top vendors, spend concentration, long-tail count → Step 03
- Duplicate vendor categories detected → Step 07
- Strategic scoring summary by score band → Step 08
- Recommendation distribution (Optimize/Consolidate/Terminate/Unknown) → Step 05
- Total identified savings across Top 3 Opportunities → Step 09

Compile the following metrics directly from that in-context data:

1. Total vendor spend
2. Top 5 vendors by spend (name + spend + % of total)
3. Spend concentration: top 10 vendors as % of total spend
4. Long-tail vendor count (spend < $50,000) and their combined spend
5. Number of duplicate vendor categories (categories with 2+ vendors)
6. Vendor strategic scoring summary: count by score band (5, 4, 3, 2, 1)
7. Recommendation distribution: count of Optimize / Consolidate / Terminate / Unknown
8. Total identified annual savings across Top 3 Opportunities

Format as a structured metrics report.
These metrics are for log traceability only — do not write them to the Excel workbook.
<!-- /STEP:10 -->

---

<!-- STEP:11 -->
You are performing STEP 11 of the Vendor Spend Strategy assessment.

TASK: Populate the Methodology sheet.

The workbook is located at: ${WORKBOOK}

Read the Methodology sheet in ${WORKBOOK} — understand its structure and read
the full content of A1 which contains the template instructions.
Comply strictly with those instructions. Do NOT overwrite A1.

Write a first-person methodology explanation as VP of Operations, who personally conducted this vendor spend assessment.

Structure the content under exactly these 4 headings with bullet points under each. Do not use paragraph prose — bullets only under each heading.

1. APPROACH: 
  - How you structured the analysis end to end
  - How the vendor dataset was reviewed and spend distribution understood
  - How the workbook structure and template constraints were identified upfront
  - How the analysis was sequenced: inspection, classification, opportunities, recommendations

2. METHODOLOGY:
  - Data review: vendor spend data sourced from workbook, total spend and concentration analysed
  - Spend concentration analysis: top 10 vendors ranked by spend, long-tail vendors below $50K identified
  - Vendor categorisation: service categories and departments assigned using domain knowledge
  - Service overlap identification: duplicate categories detected, consolidation candidates flagged
  - Cost optimisation framework: Terminate / Consolidate / Optimize decision rules applied per vendor
  - Opportunity prioritisation: top 3 opportunities selected by highest estimated annual savings

3. PROMPTS:
  - A 16-step structured prompt workflow was designed and executed sequentially via Claude Code CLI
  - Each step had a single clearly scoped analytical task: inspect, classify, score, identify, validate, document
  - Key prompts covered: workbook inspection, vendor classification, duplicate detection, strategic scoring, opportunity identification, methodology documentation, and executive memo generation
  - All prompts enforced strict output format rules: allowed departments, recommendation values, cell-level write constraints
  - Prompts were passed to Claude Code CLI via stdin pipe in non-interactive mode using printf

4. TOOLS:
  - Claude Code CLI (Anthropic): AI reasoning and analytical tasks across all 16 steps
  - Node.js with xlsx (SheetJS) library: Excel workbook read and write operations
  - Python with openpyxl: post-pipeline formatting restoration from original template
  - Bash orchestration script: step sequencing, checkpoint and resume logic, log capture

Tone: professional, first-person, factual and concise.

Comply with the template instructions in A1.
Do NOT overwrite the A1 instruction cell.

Write content to appropriate data cells only using encode_cell.
Do not use aoa_to_sheet or methods that rebuild the sheet.
<!-- /STEP:11 -->

---

<!-- STEP:12 -->
You are performing STEP 12 of the Vendor Spend Strategy assessment.

TASK: Generate the CEO/CFO executive memo.

The workbook is located at: ${WORKBOOK}

Read ONLY the CEOCFO Recommendations sheet to check A1 template instructions and
confirm the cell structure. Do NOT overwrite A1 or A2.

Do NOT re-read the Vendor Analysis Assessment sheet or the Top 3 Opportunities sheet.
All required numbers are already in context:
- Total spend, vendor count, recommendation breakdown → Step 10
- Top vendor names and spend → Step 03
- Top 3 opportunity titles and savings figures → Step 09
- Department spend breakdown → Step 04/05

Using your executive communication expertise, write a concise and compelling memo
for a CEO and CFO audience using the actual numbers already in context.

Write a MAXIMUM 1-PAGE executive memo. Every word must earn its place.
No preamble. No padding. No repetition.
Free of spelling, grammatical, and mathematical errors.
Use actual numbers from prior steps.

Structure the memo exactly as follows — use - for ALL bullet points:

MEMORANDUM
TO: Chief Executive Officer | Chief Financial Officer
FROM: R Jegadeswari, VP of Operations
DATE: [today's date]
RE: Vendor Spend Rationalisation — Findings & Recommendations

1. VENDOR SPEND OVERVIEW
  - [total vendor count] active vendors | Total LTM spend: $[amount]
  - Breakdown: [Terminate count] vendors for Termination ($[amount], [%]); [Optimize count] for Optimisation ($[amount], [%]); [Consolidate count] for Consolidation ($[amount], [%])
  - Top 10 vendors account for [X]% of total spend — acute concentration risk

2. MAJOR COST DRIVERS
  - [Top vendor name] represents $[amount] ([X]% of total spend) — highest-impact renegotiation target
  - Top departments by spend: [dept 1] ($[amount]), [dept 2] ($[amount]), [dept 3] ($[amount])

3. TOP 3 OPPORTUNITIES
  - [Opportunity 1 title]: [action] — est. $[savings]
  - [Opportunity 2 title]: [action] — est. $[savings]
  - [Opportunity 3 title]: [action] — est. $[savings]
  Total estimated savings: $[total]

4. ESTIMATED SAVINGS SUMMARY
  - Total identified savings: $[amount] ([X]% of total LTM spend)
  - Year 1 conservatively realisable: $[amount] (50–70% of identified savings)
  - Payback on implementation effort: under 6 months

5. IMPLEMENTATION ROADMAP
  - Month 1-2: Terminate low-value vendor contracts at next renewal
  - Month 2-4: Consolidate duplicate tool categories; migrate to preferred platform
  - Month 3-6: Renegotiate strategic vendor contracts with benchmarking data
  - Month 6+:  Establish quarterly vendor review cadence and spend monitoring

6. RISKS AND MITIGATIONS
  - [Risk 1 — highest impact]: [mitigation in 8 words]
  - [Risk 2 — second highest]: [mitigation in 8 words]

Recommended next step: [one sentence]

Tone: executive, data-driven, no hedging

Do NOT overwrite A1 or A2.

Write the complete memo as a single continuous text block into cell A3 only.
Use \n for line breaks within the string. Use double \n\n between sections.
Use encode_cell to write ONLY to A3.
Do not use aoa_to_sheet or methods that rebuild the sheet.
<!-- /STEP:12 -->

---

<!-- STEP:13 -->
You are performing STEP 13 of the Vendor Spend Strategy assessment.

TASK: Validate all vendor rows and outputs.

The workbook is located at: ${WORKBOOK}

VALIDATION STRATEGY — minimise file reads:
The full vendor list with Department, Description, and Suggestion values was written
by the script write-back from step05_vendors.json. Do NOT re-read all rows from
scratch. Instead, read ONLY these 4 columns from the Vendor Analysis Assessment
sheet: Vendor Name, Department, Suggestions, Description.
Also read Top 3 Opportunities, Methodology, and CEOCFO Recommendations sheets
(small sheets, fast reads) to confirm population.

Validate every vendor row for:
  - Department is populated AND is one of:
     Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
     Professional Services | Sales | Support | Finance | Unknown
  - '1-line Description on what the Vendor does' is non-empty
  - 'Suggestions (Consolidate / Terminate / Optimize costs)' is one of:
     Optimize | Consolidate | Terminate | Unknown

    Vendors with Suggestions=Unknown are valid — blank vendor names flagged for human review.

Print a validation report:
  PASS: vendor name — all fields valid
  FAIL: vendor name — field(s) that failed and reason

If any rows FAIL:
  - Determine corrected values for the affected fields.
  - Update ONLY the specific cells that require correction using encode_cell.
  - Only repair the rows that failed — do NOT regenerate valid rows.

IMPORTANT:
• Do NOT recreate or overwrite the worksheet.
• Do NOT use XLSX.utils.aoa_to_sheet.
• Only update the required cells beneath the header rows.
• Preserve existing formatting, column widths, and styles.
• Preserve the instruction cell (A1).
• Preserve the first row (column headers) and first column (row labels).

Write the corrected values back to the workbook and report each correction made.

Print final summary:
  Total rows validated : X
  Passed               : X
  Failed and corrected : X

Also confirm:
  - Top 3 Opportunities sheet has 3 rows populated
  - Methodology sheet has content
  - CEOCFO Recommendations A3 contains the memo
<!-- /STEP:13 -->

---

<!-- STEP:14 -->
You are performing STEP 14 of the Vendor Spend Strategy assessment.

TASK: Review and improve analysis quality.

The workbook is located at: ${WORKBOOK}

Read the full Vendor Analysis Assessment sheet and the Top 3 Opportunities
sheet from ${WORKBOOK}.

Using your expertise as a senior vendor strategy analyst, perform a final quality review of all classifications and outputs.

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

If improvements are needed, update the affected cells only using encode_cell.
Preserve all existing sheet structure. Do not rebuild the sheet.

Print a review summary: each correction made and the reason for it.

If no corrections are needed, state that explicitly.
<!-- /STEP:14 -->

---

<!-- STEP:15 -->
You are performing STEP 15 of the Vendor Spend Strategy assessment.

TASK: Perform confidence and review check — flag low-confidence items.

Using your expertise as a senior vendor strategy analyst, perform a confidence assessment before final save.

The workbook is located at: ${WORKBOOK}

Read vendor name, department, and suggestion for all rows from the
Vendor Analysis Assessment sheet in ${WORKBOOK}.

For each vendor, assign a confidence level:
  HIGH   — vendor identity is well-known; classification is unambiguous
  MEDIUM — vendor identity is recognisable; classification is reasonable but not certain
  LOW    — vendor name is unfamiliar, ambiguous, or too generic to classify with confidence

Print a confidence report:
  Vendor Name | Confidence | Reason if MEDIUM or LOW

Evaluate confidence level for each classification. Flag vendors for human review if:
- Vendor identity is unclear from the name alone
- Service category is ambiguous
- Department classification is uncertain
- Limited context about the vendor's function

Specifically ensure:
- All high-impact Terminate recommendations have strong analytical justification
- No strategic vendor (cloud infrastructure, core CRM, security) is marked Terminate
- All major Consolidate recommendations identify the specific overlap or duplication
- All Optimize recommendations identify the specific renegotiation or right-sizing lever

Report a confidence summary listing:
- Total vendors reviewed
- HIGH confidence vendors   : X
- MEDIUM confidence vendors   : X
- LOW confidence vendors   : X
- Specific vendors flagged, with reason

Also document the following risks for the audit trail:
  - Operational disruption from tool consolidation → phased migration plan
  - Contract lock-in and early termination penalties → align to renewal windows
  - Savings realisation delay due to migration costs → net savings model
  - Stakeholder resistance from business unit owners → executive sponsorship required

State whether the workbook is READY TO SAVE or whether human review is recommended first.

Only proceed to STEP 16 after this review is complete.
<!-- /STEP:15 -->

---

<!-- STEP:16 -->
You are performing STEP 16 of the Vendor Spend Strategy assessment.

TASK: Confirm final workbook state and ensure it is saved.

The workbook is located at: ${WORKBOOK}

Using your vendor spend analysis expertise, perform a final confirmation that all outputs are complete and accurate before closing the assessment.

Read and confirm the following from the workbook at ${WORKBOOK}:
- Total vendors classified in Vendor Analysis Assessment
- Count of fully populated rows (Department + Description + Suggestion all present)
- Breakdown by recommendation type: Terminate / Consolidate / Optimize / Unknown
- Top 3 Opportunities sheet: 3 rows populated — yes/no
- Methodology sheet: populated — yes/no
- CEOCFO Recommendations A3: memo present — yes/no
- All sheets present: Vendor Analysis Assessment, Top 3 Opportunities, Methodology,
  CEOCFO Recommendations, Config

Also confirm and report:
- Total vendor count and total LTM spend
- Breakdown by recommendation: Terminate / Consolidate / Optimize / Unknown counts
- Total identified annual savings from Top 3 Opportunities sheet

The workbook at ${WORKBOOK} is the live file. All previous steps have been writing
directly to this file. Confirm the final state is correct.

If any step's changes were not persisted, re-apply them now using encode_cell.

Confirm the workbook at ${WORKBOOK} is complete and saved.

Report the final assessment summary confirming all outputs are in place.

Print: Assessment complete. Output saved to: ${WORKBOOK}
<!-- /STEP:16 -->