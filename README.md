# Overview
This is an AI-orchestrated vendor rationalization workflow using Claude Code CLI. Converts a manual spreadsheet-based vendor review into a repeatable, automated assessment that classifies vendors, identifies cost optimization opportunities, and produces executive-ready outputs.

# Approach
  - Post-acquisition vendor due diligence, focused on identifying cost optimisation opportunities and spend inefficiencies.
  - Treated the problem as a repeatable operational workflow, not a one-time analysis.
  - Sequenced the analysis: spend visibility → classification → consolidation → optimisation → executive synthesis.
  - Focused on key procurement levers: duplicate vendors, long-tail spend, SaaS sprawl, and renegotiation opportunities.
  - Applied a structured decision model: Terminate | Consolidate | Optimize.
  - Produced audit-ready, CFO-relevant outputs with quantified savings and prioritised actions.

# AI-Orchestrated Workflow

<img width="719" height="391" alt="image" src="https://github.com/user-attachments/assets/7915f9ac-481a-4576-8497-c773c2b99b7e" />

# Design Principles
  - Separated AI reasoning from execution, improving stability and control.
  - Implemented Reason → Validate → Persist, enabling a self-healing workflow.
  - Designed for idempotency, ensuring consistent results across repeated runs.
  - Preserved source data integrity and enforced controlled outputs.
  - Enabled observability through step-level logging for auditability.

# Methodology
  - Phase 1 — Workbook Inspection & Validation
  - Phase 2 — Spend Analysis & Concentration
  - Phase 3 — Optimization Analysis
  - Phase 4 — Executive Outputs
  - Phase 5 — Quality Assurance
  - Phase 4 — Finalization
  
# Tools & Environment
  - AI Assistant: Claude (Anthropic) via Claude Code CLI — used for structured reasoning and analysis
  - Runtime: Node.js with xlsx (SheetJS) for controlled Excel read/write
  - Data Source: Vendor spend dataset from assessment workbook

**Note:** Input data was sourced from a Google Sheet (downloaded as .xlsx). The processed output is published as a Google Sheet (link), with the .xlsx version preserved in this repository.
  
# Repository Structure

<img width="709" height="265" alt="image" src="https://github.com/user-attachments/assets/283e579e-38ef-4413-b53f-4ab81999606d" />



