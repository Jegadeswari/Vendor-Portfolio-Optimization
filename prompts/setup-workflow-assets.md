# Workflow Asset Setup

This file contains the instructions used by Claude Code CLI to generate the automation assets required for the Vendor Spend Strategy assessment.

Running these instructions will create the workflow documentation, automation script, and logging structure used to execute the vendor rationalization process.

---

## Workflow Generation Task


Treat `setup-workflow-assets.md` as the source of truth for regenerating workflow assets.

Generate the automation assets required to operationalize the Vendor Spend Strategy assessment using Claude Code CLI.

Create the following artifacts in the repository:

1. `README.md`
2. `prompts/vendor-spend-workflow.md`
3. `scripts/vendor_rationalization.sh`
4. `logs/` (directory for workflow execution logs)

Ensure the `prompts` directory exists before creating `prompts/vendor-spend-workflow.md`.

If the files already exist, replace their entire contents with the newly generated versions rather than skipping creation.

---

### Architecture Rule

Maintain strict separation between workflow definition and execution.

`vendor-spend-workflow.md` contains the complete workflow logic and analytical prompts.

`vendor_rationalization.sh` is responsible only for:

• locating the repository root
• ensuring the logs directory exists
• executing the workflow using Claude Code CLI
• capturing execution logs

The script must not embed workflow prompts.

---

The README should document:

• the purpose of the workflow
• repository structure
• setup prerequisites
• workflow execution steps
• logging behavior
• how AI agents are integrated into operational workflows


Use Claude Code’s Write tool to overwrite the artifacts if they already exist. Replace the entire contents of the file with the newly generated version.

Return the created files so they appear in the repository.

Do not execute the workflow and do not modify the Excel workbook at this stage.

Only generate the workflow assets required to run the assessment.

---

WORKBOOK UPDATE SAFETY RULES

When writing to Excel worksheets:

• Never recreate or replace an entire worksheet.
• Never use XLSX.utils.aoa_to_sheet or any method that rebuilds the sheet.
• Only update the specific cells required for the task.
• Always preserve existing column headers, formatting, and template structure.
• Preserve the first row (column headers), first column if it contains row labels, and the instruction cell (A1).
• Column additions are allowed ONLY when explicitly required by the workflow 
(e.g., adding 'Estimated Annual Savings (USD)' in the 'Top 3 Opportunities' sheet).

All other updates must modify existing cells only.

---

PHASE 1 — Workbook Inspection

STEP 1 — Inspect Workbook Structure

Open the Excel workbook and confirm the presence of the following sheets:

• Vendor Analysis Assessment
• Top 3 Opportunities
• Methodology
• CEOCFO Recommendations

Inspect column names in:

Vendor Analysis Assessment

Confirm presence of:

• Vendor Name
• Last 12 months Cost (USD)

Do not modify these columns.
---

STEP 2 — Template Instruction Compliance

For each worksheet in the workbook, first review any instructions provided in the template.

In particular, inspect cell (Row 1, Column 1) for guidance on structure, format, word limits, or output constraints. Do not overwrite this cell, as it contains instructions governing the analysis and documentation.

All generated outputs must comply with these instructions.

If template instructions conflict with workflow guidance, the template instructions take precedence.

---
PHASE 2 — Vendor Spend Analysis

STEP 3 — Perform Vendor Spend Analysis

Calculate:

• Total vendor spend
• Top 10 vendors by spend
• Spend concentration percentage of top vendors

Identify:

• long-tail vendors (e.g., vendors with spend below $50K)
• high-spend strategic vendors

Store this analysis for later use when identifying optimization opportunities.

---

STEP 4 — Vendor Category Classification

For each vendor:

Infer vendor category using vendor name context and industry knowledge.

Example categories include:

• Cloud Infrastructure
• Data Platforms
• Security
• Marketing Automation
• CRM
• Developer Tools
• Analytics
• Facilities
• Legal Services
• Recruiting
• Productivity SaaS
• Professional Services

After determining the vendor category, map the vendor to a Department using ONLY the following allowed values:

1. Engineering
2. Facilities
3. G&A
4. Legal
5. M&A
6. Marketing
7. SaaS
8. Product
9. Professional Services
10. Sales
11. Support
12. Finance

---

STEP 5 — Populate Vendor Analysis

For every row in Vendor Analysis Assessment:

Populate the following columns:

• Department
• 1-line Description on what the Vendor does
• Suggestions (Consolidate / Terminate / Optimize costs)

Allowed suggestions/recommendations:

• Terminate
• Consolidate
• Optimize

Recommendation rules:

Terminate

* low spend vendors
* redundant services
* long-tail vendors with minimal strategic value

Consolidate

* duplicate vendors in the same category
* overlapping SaaS products or services

Optimize

* high spend strategic vendors where contract renegotiation or pricing optimization or license right-sizing can generate savings

Vendor Name and Last 12 months Cost (USD) must remain unchanged.

---

STEP 6 — Capture Decision Rationale

For each vendor recommendation generated in the Vendor Analysis Assessment sheet, record the reasoning behind the recommendation.

The rationale should reference factors such as:

• vendor spend level
• category overlap or duplication
• strategic importance to product or operations
• potential for renegotiation or optimization

Ensure the reasoning is concise and logically explains why the vendor was classified as:

• Terminate
• Consolidate
• Optimize

This reasoning should be used to improve recommendation quality and ensure the analysis remains explainable and defensible.
---

PHASE 3 — Optimization Analysis

STEP 7 — Detect Duplicate Vendor Categories

Group vendors by category.

Identify categories that contain multiple vendors performing similar functions.

Calculate combined spend per category.

Flag potential vendor consolidation opportunities where multiple vendors provide overlapping capabilities.

---

STEP 8 — Strategic Vendor Scoring

Evaluate each vendor based on strategic importance. 

Factors may include:

• role in product infrastructure
• customer-facing capabilities
• operational criticality
• redundancy or overlap with other vendors

Use this evaluation and score to refine recommendation accuracy.

For example:

Strategic vendors → Optimize
Redundant vendors → Consolidate
Low-value vendors → Terminate

---

STEP 9 — Identify Strategic Opportunities

Analyze vendor spend data and identify the three highest impact cost optimization opportunities.

Focus on:

• high-spend vendors renegotiation
• SaaS license optimization
• vendor consolidation opportunities
• long-tail vendor cleanup

Populate Top 3 Opportunities sheet with:

• Opportunity Title
• Explanation
• Estimated Annual Savings (USD)

Savings estimates should be derived from typical benchmarks such as:

• renegotiation potential (10–15%)
• SaaS license optimization (15–30%)
• vendor consolidation (15–20%)

Prioritize opportunities based on highest potential financial impact.

---

STEP 10 — Record Analysis Metrics

Record key intermediate analysis metrics in the execution log to maintain an auditable analysis trail.

Log items such as:

• total vendor spend  
• top vendors by spend  
• spend concentration across vendors  
• number of long-tail vendors identified  
• duplicate vendor categories detected  
• vendor strategic scoring summary  

These metrics should be written to the workflow execution log for traceability but do not need to be written to the Excel workbook.

---

PHASE 4 — Executive Outputs

STEP 11 — Populate Methodology

Populate Methodology sheet with a structured explanation of the analytical approach used in this workflow.

Cover the following stages:

• workbook inspection and validation  
• vendor spend analysis and concentration assessment  
• vendor categorization and department classification  
• duplicate vendor detection and consolidation analysis  
• recommendation generation (Terminate / Consolidate / Optimize)  
• opportunity identification and savings estimation  
• executive recommendation development  

Ensure the output complies with the template instructions identified earlier in row 1 column 1 and as given in Step 2.

---

STEP 12 — Generate CEO/CFO Executive Memo

Populate CEOCFO Recommendations sheet with a concise executive memo including:

• vendor spend overview
• major cost drivers
• top optimization opportunities
• estimated savings
• implementation roadmap
• risks and mitigation

Tone should be executive level and concise with focus on strategic financial impact.

Ensure the output complies with the template instructions identified earlier in row 1 column 1 and as given in Step 2.

---

PHASE 5 — Quality Assurance

STEP 13 — Validation

Ensure:

• every vendor has a Department
• every vendor has a "1-line Description on what the Vendor does"
• every vendor has a Suggestions value (Terminate / Consolidate / Optimize)
• no vendor category is undefined
• recommendations follow the defined logic
• each recommendation has a clear and defensible rationale
• Top 3 Opportunities reflect the highest financial impact
• all generated outputs comply with the template instructions identified earlier

---

STEP 14 — Review and Improve Analysis

Re-check the workflow results and improve analysis quality.

Specifically:

• re-evaluate vendor department assignments
• improve vendor description accuracy
• verify recommendation alignment with vendor strategic importance
• confirm the Top 3 Opportunities represent the largest potential savings

---

STEP 15 — Confidence and Review Check

Evaluate the confidence level of the generated classifications, recommendations, and opportunity analysis.

Identify any cases where confidence may be low due to:

• unclear vendor identity
• ambiguous vendor category
• uncertain department classification
• limited context about vendor function

For such cases, flag the vendor for human review before final decision making.

Ensure that all high-impact recommendations, especially those involving vendor termination or major consolidation, have strong analytical justification.

Proceed to save the workbook only after completing this confidence review.

---

PHASE 6 — Finalization

STEP 16 — Save Workbook

Save the updated workbook to the same path:

outputs/A - TEMPLATE - RWA - Vendor Spend Strategy (R Jegadeswari).xlsx