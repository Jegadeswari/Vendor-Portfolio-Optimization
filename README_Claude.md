# Vendor Spend Strategy — AI-Orchestrated Assessment

This repository contains the automation assets for the Vendor Spend Strategy assessment.
The workflow uses Claude Code CLI to analyse vendor spend data, classify vendors by department
and category, identify cost optimisation opportunities, and produce executive-ready outputs —
all written directly into the Excel workbook.

---

## Purpose

The workflow performs a structured, 16-step vendor rationalisation across six phases:

1. **Workbook Inspection** — validates sheet structure and reads template constraints
2. **Vendor Spend Analysis** — calculates spend concentration, classifies vendors, generates recommendations
3. **Optimisation Analysis** — detects duplicate categories, scores vendors strategically, identifies top 3 savings opportunities
4. **Executive Outputs** — populates the Methodology and CEO/CFO Recommendations sheets
5. **Quality Assurance** — validates all vendor rows, reviews classification accuracy, performs confidence check
6. **Finalisation** — confirms and saves the completed workbook

---

## Repository Structure

```
Vendor-Portfolio-Optimization/
├── README_Claude.md                   # Claude Code CLI generated README file
├── README.md                          # This file
├── data/
│   └── A - TEMPLATE - RWA - Vendor Spend Strategy (NAME).xlsx
├── prompts/
│   ├── setup-workflow-assets.md       # Source of truth for regenerating workflow assets
│   └── vendor-spend-workflow.md       # Complete workflow logic and analytical prompts
├── scripts/
│   └── vendor_rationalization.sh      # Orchestration script — no embedded prompts
├── outputs/
│   └── A - TEMPLATE - RWA - Vendor Spend Strategy (R Jegadeswari).xlsx
└── logs/                              # Execution logs (auto-created at runtime)
```

**Architecture rule:** `prompts/vendor-spend-workflow.md` owns all workflow logic and analytical
prompts. `scripts/vendor_rationalization.sh` owns only orchestration — locating the repo root,
ensuring the logs directory, invoking Claude Code CLI, and capturing logs. The script contains
no analytical prompts.

---

## Prerequisites

| Requirement | Verification |
|---|---|
| Claude Code CLI installed and authenticated | `claude --version` |
| Node.js (v18+) | `node --version` |
| npm `xlsx` package installed | `npm list xlsx` |

Install the `xlsx` package if missing:

```bash
npm install xlsx
```

Install the `docx` package if missing:

```bash
npm install docx
```

---

## Workflow Execution

Run the full 16-step assessment from the repository root:

```bash
bash scripts/vendor_rationalization.sh
```

The script will:
1. Locate the repository root and verify the workbook and Claude CLI are present
2. Extract each step's prompt from `prompts/vendor-spend-workflow.md`
3. Execute each step via `claude -p` in non-interactive mode
4. Write results directly to the Excel workbook using Node.js and the `xlsx` library
5. Capture a timestamped log file per step in `logs/`

To regenerate workflow assets (README, prompts, script) without running the assessment:

```bash
claude "$(cat prompts/setup-workflow-assets.md)"
```

---

## Workflow Steps

| Phase | Step | Description |
|---|---|---|
| Workbook Inspection | 01 | Inspect workbook structure — confirm sheets and columns |
| Workbook Inspection | 02 | Read template instruction constraints from each sheet |
| Vendor Spend Analysis | 03 | Calculate total spend, top 10 vendors, long-tail identification |
| Vendor Spend Analysis | 04 | Classify vendor categories and assign departments |
| Vendor Spend Analysis | 05 | Populate Department, Description, and Suggestions columns |
| Vendor Spend Analysis | 06 | Capture decision rationale for each recommendation |
| Optimisation Analysis | 07 | Detect duplicate vendor categories and consolidation opportunities |
| Optimisation Analysis | 08 | Score vendors by strategic importance |
| Optimisation Analysis | 09 | Identify top 3 cost optimisation opportunities |
| Optimisation Analysis | 10 | Record analysis metrics for audit trail |
| Executive Outputs | 11 | Populate Methodology sheet |
| Executive Outputs | 12 | Generate CEO/CFO executive memo |
| Quality Assurance | 13 | Validate all vendor rows and outputs |
| Quality Assurance | 14 | Review and improve analysis quality |
| Quality Assurance | 15 | Confidence and review check — flag low-confidence items |
| Finalisation | 16 | Confirm and save final workbook |

---

## Logging Behaviour

Each step produces a dedicated log file in `logs/`:

| Log file | Step |
|---|---|
| `step01_inspect.log` | Workbook structure inspection |
| `step02_template.log` | Template instruction compliance |
| `step03_spend_analysis.log` | Vendor spend analysis |
| `step04_classify.log` | Vendor category classification |
| `step05_populate.log` | Populate vendor analysis columns |
| `step06_rationale.log` | Capture decision rationale |
| `step07_duplicates.log` | Duplicate vendor category detection |
| `step08_scoring.log` | Strategic vendor scoring |
| `step09_opportunities.log` | Top 3 opportunity identification |
| `step10_metrics.log` | Analysis metrics audit trail |
| `step11_methodology.log` | Methodology sheet population |
| `step12_memo.log` | CEO/CFO executive memo |
| `step13_validation.log` | Validation check |
| `step14_review.log` | Review and improve analysis |
| `step15_confidence.log` | Confidence and review check |
| `step16_save.log` | Final workbook confirmation |

Logs are plain text and contain the full Claude response for each step, providing an
auditable trail of the analysis. Audit trail metrics (total spend, recommendation
breakdown, vendor counts) are written to the log only — not to the workbook.

---

## Workbook Safety Rules

The workflow enforces strict cell-level write rules to protect the Excel template:

- **Never** recreate or replace an entire worksheet
- **Never** use `XLSX.utils.aoa_to_sheet` or any method that rebuilds the sheet
- Only update the specific cells required for each step
- Preserve existing column headers, formatting, and template structure
- Preserve the first row (column headers), first column if it contains row labels, and the instruction cell (A1)
- The only permitted column addition is `Estimated Annual Savings (USD)` in the `Top 3 Opportunities` sheet

---

## How AI Agents Are Integrated

The workflow treats Claude Code CLI as an analytical engine orchestrated by a shell script.
Each step is a structured natural-language prompt (defined in `prompts/vendor-spend-workflow.md`)
that instructs Claude to:

- Read Excel data via Node.js (`xlsx` library)
- Apply domain knowledge to classify, score, and recommend
- Write structured results back to the workbook via Node.js
- Return a human-readable summary to the execution log

This design separates concerns cleanly:

- **Prompts file** — defines *what* to analyse and *how* to reason
- **Script** — defines *when* each step runs and *where* to store logs
- **Claude Code CLI** — provides the analytical intelligence and Excel I/O execution

The result is a repeatable, auditable, and maintainable AI-assisted operational workflow
that can be re-run on updated data or adapted for other vendor rationalisation engagements.

---

*Workflow version: 3.0 | Author: R Jegadeswari | Date: March 2026*
