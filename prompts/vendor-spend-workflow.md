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
You are a senior vendor strategist and operations executive with expertise in optimizing vendor portfolio.

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

Report the full content of each A1 cell. These instructions take precedence over
workflow guidance where they conflict. Summarise any constraints that will affect
how outputs must be formatted in later steps.
Do not modify anything.
<!-- /STEP:02 -->

---

<!-- STEP:03 -->
You are performing STEP 03 of the Vendor Spend Strategy assessment.

TASK: Perform vendor spend analysis.

The workbook is located at: ${WORKBOOK}

Read all rows from the Vendor Analysis Assessment sheet and calculate:

- Total number of vendors
- Total spend across all vendors
- Top 10 vendors by spend with name, spend amount, and % of total spend for each
- Combined spend and % concentration of top 10 vendors
- Count of long-tail vendors with spend below $50K
- Count of high-spend strategic vendors with spend at or above $200K

Report the full analysis results. Store the findings for use in STEP 09.
<!-- /STEP:03 -->

---

<!-- STEP:04 -->
You are performing STEP 04 of the Vendor Spend Strategy assessment.

TASK: Classify vendor categories and assign departments.

The workbook is located at: ${WORKBOOK}

Read all vendor names and spend amounts from the Vendor Analysis Assessment sheet.

CRITICAL: Copy each vendor name character-for-character from the spreadsheet.
Do not retype from memory. Do not change capitalisation, punctuation, spacing, or spelling.

If the spreadsheet shows
"Navan (Tripactions Inc)" your JSON must say "Navan (Tripactions Inc)" — not "Navan", not "Navan TripActions", not any other variation.

The lookup that writes to the workbook is case-sensitive and exact-match only.
Any deviation means that vendor row will be silently skipped and left blank.

For each vendor, use your domain knowledge to:

1. Infer the vendor's service category from the vendor name. Example categories:
   Cloud Infrastructure | CRM | Security | Marketing Automation | Data Platforms |
   Developer Tools | Analytics | Facilities | Legal Services | Recruiting |
   Productivity SaaS | Professional Services | Insurance | Travel | Accounting | Finance | Other

2. Map the vendor to exactly ONE department from this allowed list:
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

Rules:
- Classify every vendor in a single pass. Do not retry or patch unmatched vendors —
  assign best-guess department based on name context. If truly unidentifiable, assign G&A.
  Produce the classification table once and stop.
- Use industry knowledge of widely known vendors when determining service category.
- If vendor identity or category is uncertain, infer the most likely service based
  on industry knowledge rather than defaulting to generic SaaS categories.
- Do not leave any vendor unclassified

Report a full classification table showing Vendor Name, Spend, Category, and Department for every vendor once and stop. This will be used in STEP 05.

<!-- /STEP:04 -->

---

<!-- STEP:05 -->
You are performing STEP 05 of the Vendor Spend Strategy assessment.

TASK: Determine classification values for each vendor, produce a JSON classification array for all vendors and write it to a file.

The workbook is located at: ${WORKBOOK}

STEP 1: Read vendor data from the workbook
Read vendor name, spend from the Vendor Analysis Assessment sheet in ${WORKBOOK}.

CRITICAL: Copy each vendor name character-for-character from the spreadsheet.
Do not retype from memory. Do not change capitalisation, punctuation, spacing, or spelling.

STEP 2 — Enrich vendor classification (ENHANCED)

For each vendor, determine:

1. Department (MANDATORY)
Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
Professional Services | Sales | Support | Finance

2. Description (MANDATORY)
Single concise sentence (max 120 characters)

3. Suggestion (MANDATORY)
Terminate | Consolidate | Optimize

4. Business Function (NEW — MANDATORY)
Assign exactly ONE:

- Core Product Infrastructure
- Customer Acquisition
- Revenue Operations
- Customer Support
- Internal Operations
- Compliance / Legal

5. Revenue Criticality (NEW — MANDATORY)

HIGH:
- Directly impacts revenue generation or product uptime
- Examples: CRM, payments, cloud infra, core product tools

MEDIUM:
- Indirect revenue impact
- Examples: analytics, support tools, marketing platforms

LOW:
- No short-term revenue impact
- Examples: HR tools, low-use SaaS, admin tools

STEP 3 — Recommendation logic

Terminate:
- spend < $50K
- low strategic value
- non-critical (LOW revenue criticality preferred)

Consolidate:
- duplicate vendors in same category
- overlapping tools

Optimize:
- high spend vendors (> $200K)
- HIGH or MEDIUM revenue criticality

CRITICAL RULE:
- Vendors with HIGH Revenue Criticality must NOT be Terminated

STEP 4 — Produce output JSON

Output ONLY valid JSON in this format:

[
  {
    "Vendor Name": "...",
    "Department": "...",
    "Description": "...",
    "Suggestion": "...",
    "Business Function": "...",
    "Revenue Criticality": "HIGH"
  }
]

CRITICAL OUTPUT RULES:
• Valid JSON only
• No explanations or extra text
• Include ALL vendors

STEP 5 — Write to file

Write JSON to outputs/step05_vendors.json using Node.js via Bash tool.

Print confirmation:
JSON_WRITTEN_OK records:[count]
<!-- /STEP:05 -->

---

<!-- STEP:06 -->
You are performing STEP 06 of the Vendor Spend Strategy assessment.

TASK: Capture decision rationale for each recommendation.

The workbook is located at: ${WORKBOOK}

Read vendor name, spend, department, and suggestion from the Vendor Analysis
Assessment sheet in ${WORKBOOK}.

Using your expertise in vendor strategy and procurement, for each vendor, evaluate each recommendation and record a concise rationale (1–2 sentences) explaining why the recommendation was made. Reference factors such as:

- Vendor spend level relative to thresholds ($50K = long-tail, $200K = high-spend strategic)
- Category overlap or duplication with other vendors (if Consolidate)
- Strategic importance to product or operations (if Optimize)
- Redundancy or low value (if Terminate)
- Potential for renegotiation, right-sizing, or consolidation

Print the rationale as a structured report:

Additionally, assess short-term dependency impact:

For each vendor, include:
- 30-Day Impact: What breaks if vendor is removed within 30 days
- Impact Level: HIGH | MEDIUM | LOW

Output format:
Vendor Name | Recommendation | Rationale | 30-Day Impact | Impact Level

This log is for auditability only and do not write to the workbook. 
This output will be used to validate to identify and size the top 3 cost optimization opportunities in Step 09.
<!-- /STEP:06 -->

---

<!-- STEP:07 -->
You are performing STEP 07 of the Vendor Spend Strategy assessment.

TASK: Detect duplicate vendor categories and consolidation opportunities.

The workbook is located at: ${WORKBOOK}

Read vendor names, spend, and department from the Vendor Analysis Assessment sheet in ${WORKBOOK}.

Using the vendor names, spend data, and your domain knowledge:

1. Group vendors by inferred service category (e.g., CRM, Cloud Infrastructure, Security).
2. Identify categories where multiple vendors perform overlapping or identical functions.
3. Calculate combined spend per duplicate category and rank them by combined spend (highest impact first)
4. Flag specific vendor pairs or groups that are strong consolidation candidates.

Report a consolidation opportunity analysis listing:
- Category name
- Vendors in that category
- Combined spend for the category
- Recommended consolidation action (which vendor to retain, which to consolidate away)

Print output as:
  Category | Vendors in Category | Combined Spend | Consolidation Candidate(s)

Store this analysis in memory for use in Step 09.
<!-- /STEP:07 -->

---

<!-- STEP:08 -->
You are performing STEP 08 of the Vendor Spend Strategy assessment.

TASK: Score vendors by strategic importance AND evaluate execution trade-offs.

The workbook is located at: ${WORKBOOK}

Read the populated 'Vendor Analysis Assessment' sheet.

STEP 1 — Strategic Scoring

Assign Strategic Score (1–5):

5 = Mission critical, cannot be replaced  
4 = Strategic, high switching cost  
3 = Important but substitutable  
2 = Low value, overlap exists  
1 = Redundant or unnecessary  

STEP 2 — Trade-off Modeling

For each vendor, evaluate:

1. Switching Cost
- HIGH: migration is complex, risky, or expensive
- MEDIUM: moderate effort, some disruption
- LOW: easy to replace or remove

2. Implementation Effort
- HIGH: cross-team coordination, technical migration required
- MEDIUM: moderate coordination
- LOW: minimal effort

3. Time to Realise Savings

- IMMEDIATE: 0–3 months
- MEDIUM: 3–6 months
- LONG: 6–12 months

STEP 3 — Validate Recommendation Alignment

Rules:

- Score 4–5 → Optimize
- Score 2–3 → Consolidate
- Score 1 → Terminate

Also enforce:

- HIGH Switching Cost + HIGH Criticality → Avoid Terminate
- LOW Effort + LOW Criticality → Strong Terminate candidate

STEP 4 — Output

Print structured table:

Vendor Name | Score | Suggestion | Switching Cost | Effort | Time | Conflict (Y/N)

Conflict = Y if:
- Recommendation contradicts score OR
- High critical vendor marked Terminate

Store results for Step 09 prioritization.
<!-- /STEP:08 -->

---

<!-- STEP:09 -->
You are performing STEP 09 of the Vendor Spend Strategy assessment.

TASK: Identify the top 3 cost optimization opportunities and write them to the workbook.

The workbook is located at: ${WORKBOOK}

Read the Vendor Analysis Assessment sheet from ${WORKBOOK}.

Read the Top 3 Opportunities sheet from ${WORKBOOK}. Check A1 in the Top 3 Opportunities sheet for template instructions. Do not overwrite A1.

Using your expertise in vendor cost optimisation and procurement strategy, and based on the analysis from previous steps, identify the three highest-impact cost reduction opportunities.

Focus on:
- Highest-spend vendors (prioritize by absolute USD value)
- High-spend vendor renegotiation (benchmark: 10–15% savings)
- SaaS license optimization and right-sizing (benchmark: 15–30% savings)
- Vendor consolidation opportunities (benchmark: 15–20% savings)
- Long-tail vendor termination (benchmark: 10–20% of terminate-eligible spend, accounting for notice periods, minimum commitments, and renewal timing)
  
Additionally, classify each opportunity into an Execution Track:

- Track 1: Immediate (low effort, low risk, quick savings within 0–3 months)
- Track 2: Parallel Strategic (high value, higher complexity, longer timeline 3–12 months)

Ensure:
- At least one opportunity is identified as Immediate
- At least one opportunity is identified as Parallel Strategic
- Immediate opportunity must have LOW Effort AND IMMEDIATE time to realise savings

Additionally ensure:
- At least one opportunity targets a top 5 vendor or top spend category

Use this classification to inform prioritisation and explanation of each opportunity.

Also incorporate:
- 30-Day Impact and Impact Level from Step 06
- Switching Cost, Effort, and Time from Step 08

These must directly influence opportunity selection and execution track assignment.

Prioritisation must consider:

- Financial Impact (USD savings)
- Execution Effort (derived from Step 08)
- Business Risk (Revenue Criticality from Step 05)
- Time to Value

Do NOT select top 3 based on savings alone.

Select opportunities that maximise:
High savings + Feasible execution + Minimal operational risk

Guiding principles (not hard constraints):
- Avoid selecting actions that create immediate operational disruption
- Prefer faster time-to-value where trade-offs are similar
- Ensure recommendations are specific and actionable (pricing, usage, consolidation)

For each opportunity, write:
Title
  Concise and specific (e.g. "Renegotiate Salesforce Enterprise Contract")

Explanation
  3 bullet points maximum, each bullet maximum 12 words:
  - What the problem is
  - What action to take
  - Expected outcome or saving mechanism
  - Include execution context (Immediate or Parallel Strategic where relevant)

Estimated Annual Savings (USD)
  Calculated using the actual vendor spend and benchmark above. Write as a single number.

Return EXACTLY THREE opportunities.

Execution Track classification must be reflected within the Explanation text only.
Do NOT create new columns or modify worksheet structure.

Write the three opportunities to the Top 3 Opportunities sheet:
- Update only Opportunity Title, Explanation, and Estimated Annual Savings cells
- Write to rows 2, 3, and 4 only
- If Estimated Annual Savings column does not exist, add it — only permitted column addition
- Use encode_cell to write individual cells. Do not use aoa_to_sheet or methods that rebuild the sheet.

Print confirmation for the three opporutnities written to the worksheet:
  Opportunity Title | Estimated Annual Savings (USD)
<!-- /STEP:09 -->

---

<!-- STEP:10 -->
You are performing STEP 10 of the Vendor Spend Strategy assessment.

TASK: Record analysis metrics for the audit trail.

The workbook is located at: ${WORKBOOK}

Read the Vendor Analysis Assessment sheet and the Top 3 Opportunities sheet from ${WORKBOOK}.

Also recall from memory:
- Duplicate vendor categories identified in Step 07
- Strategic scoring summary from Step 08

Using your vendor spend analysis expertise, compile and record the following metrics for the audit trail:

1. Total vendor spend (sum of all 'Last 12 months Cost (USD)')
2. Top 5 vendors by spend (name + spend + % of total)
3. Spend concentration: top 10 vendors as % of total spend
4. Long-tail vendor count (spend <= $50,000) and their combined spend
5. Number of duplicate vendor categories detected (categories with 2+ vendors)
6. Vendor strategic scoring summary: count of vendors by score band (5, 4, 3, 2, 1)
7. Recommendation distribution: count of Optimize / Consolidate / Terminate / Unknown
8. Total identified annual savings across Top 3 Opportunities

Format as a structured metrics report. These metrics are for log traceability only — do not write them to the Excel workbook.
<!-- /STEP:10 -->

---

<!-- STEP:11 -->
You are performing STEP 11 of the Vendor Spend Strategy assessment.

TASK: Populate the Methodology sheet.

The workbook is located at: ${WORKBOOK}

Read the Methodology sheet in ${WORKBOOK} — understand its structure and any template instructions in A1.
Comply strictly with those instructions in A1. Do NOT overwrite A1.

Write methodology explanation as VP of Operations, who personally conducted this vendor spend assessment.

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
  - Opportunity prioritisation: top 3 opportunities selected using multi-factor evaluation (financial impact, execution effort, business risk, time to value)

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

Read the Vendor Analysis Assessment sheet from ${WORKBOOK}.

Read the Top 3 Opportunities sheet from ${WORKBOOK}. Check A1 in the Top 3 Opportunities sheet for template instructions. Do not overwrite A1.

Read the CEOCFO Recommendations sheet to check A1 template instructions and confirm the cell structure. Do NOT overwrite A1 or A2.

Using your executive communication expertise, write a concise and compelling memo for a CEO and CFO audience using the actual numbers already in context.

Write a MAXIMUM 1-PAGE executive memo. Every word must earn its place. No preamble. No padding. No repetition. Free of spelling, grammatical, and mathematical errors. Use actual numbers from prior steps.

Structure the memo exactly as follows — use - for ALL bullet points:

MEMORANDUM
TO: Chief Executive Officer | Chief Financial Officer
FROM: [your name/role]
DATE: [today]
RE: Vendor Spend Rationalisation — Findings & Recommendations

1. VENDOR SPEND OVERVIEW
  - [total vendor count] active vendors | Total LTM spend: $[amount]
  - Breakdown: [Terminate count] vendors for Termination ($[amount], [%]); [Optimize count] for Optimisation ($[amount], [%]); [Consolidate count] for Consolidation ($[amount], [%])
  - Top 10 vendors account for [X]% of total spend — acute concentration risk

3. TOP 3 OPPORTUNITIES
  - Opportunities structured across Immediate and Parallel Strategic tracks to maximise speed, feasibility, and minimise operational risk
  - [Opportunity 1 title] (Immediate): [action] — est. $[savings]
  - [Opportunity 2 title] (Parallel Strategic): [action] — est. $[savings]
  - [Opportunity 3 title]: [action] — est. $[savings]
  Total estimated savings: $[total]

4. ESTIMATED SAVINGS SUMMARY
  - Total identified savings: $[amount] ([X]% of total LTM spend)
  - Year 1 conservatively realisable: $[amount] (50–70% of identified savings)
  - Use a realistic estimate within the benchmark range; avoid consistently selecting extreme high-end values unless justified.
  - Payback on implementation effort: under 6 months

5. IMPLEMENTATION ROADMAP
  - Month 1–2: [one concise, specific action including vendor/category where relevant; execute immediate actions and initiate strategic work in parallel]
  - Month 3–4: [continue consolidation or optimisation actions; advance strategic initiatives]
  - Month 4–6: [complete major strategic initiatives and embed controls]
  - Month 6+: [institutionalise vendor governance and prevent spend creep]

Use specific vendors, categories, or quantified actions from the analysis where relevant. Avoid generic phrasing.

6. RISKS AND MITIGATIONS
  - [Risk 1]: [mitigation in 8 words]
  - [Risk 2]: [mitigation in 8 words]
  - [Risk 3]: [mitigation in 8 words]

Recommended next step: [one sentence that prioritises the highest-impact action while explicitly initiating parallel execution of immediate opportunities. Include vendor, timing, owner, and secondary parallel action.]

Tone: executive, data-driven, no hedging.

Do NOT overwrite A1 or A2.

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

Read all rows from the Vendor Analysis Assessment sheet in ${WORKBOOK}.

Also read the Top 3 Opportunities sheet, Methodology sheet, and CEOCFO
Recommendations sheet from ${WORKBOOK} to validate their content.

Using your data quality and vendor spend expertise, validate every vendor row for completeness and accuracy:
  - Department is populated AND is one of:
     Engineering | Facilities | G&A | Legal | M&A | Marketing | SaaS | Product |
     Professional Services | Sales | Support | Finance | Unknown
  - '1-line Description on what the Vendor does' is non-empty
  - 'Suggestions (Consolidate / Terminate / Optimize costs)' is one of:
     Optimize | Consolidate | Terminate | Unknown

    
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

Write the corrected values back to the workbook and report each correction made.

Print final summary:
  Total rows validated : X
  Passed               : X
  Failed and corrected : X

Also confirm:
  - Top 3 Opportunities sheet has 3 rows populated
  - Methodology sheet has content
  - CEOCFO Recommendations contains the memo in A3
<!-- /STEP:13 -->

---

<!-- STEP:14 -->
You are performing STEP 14 of the Vendor Spend Strategy assessment.

TASK: Review and improve analysis quality.

The workbook is located at: ${WORKBOOK}

Read the full Vendor Analysis Assessment sheet and the Top 3 Opportunities sheet from ${WORKBOOK}.

Using your expertise as a senior vendor strategy analyst, perform a critical second-pass review:

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
  - Replace any opportunity with a higher-impact and executable alternative if identified,considering effort, risk, and time to value

If improvements are needed, update the affected cells only using encode_cell.
Preserve all existing sheet structure. Do not rebuild the sheet.

Print a review summary: each correction made and the reason for it.

If no corrections are needed, state that explicitly.
<!-- /STEP:14 -->

---

<!-- STEP:15 -->
You are performing STEP 15 of the Vendor Spend Strategy assessment.

TASK: Perform confidence and review check — flag low-confidence items.

The workbook is located at: ${WORKBOOK}

Read vendor name, department, and suggestion for all rows from the Vendor Analysis Assessment sheet in ${WORKBOOK}.

Using your expertise as a senior vendor strategy analyst, perform a confidence assessment  and assign a confidence level for each vendor:

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