# Overview
This is an AI-orchestrated vendor rationalization operating workflow built using Claude Code CLI.

It transforms a manual, spreadsheet-driven vendor review into a repeatable, execution-aware system that:

- Classifies vendors using business context and criticality
- Identifies cost optimization opportunities using multi-factor evaluation
- Prioritizes actions based on **feasibility, risk, and time-to-value**
- Produces **executive-ready outputs** with clear, actionable recommendations

The system is designed not as a one-time analysis, but as a **scalable decision engin**e for vendor strategy.

# Approach
- Framed the problem as a** repeatable operational workflow**, not a static analysis
- Sequenced decision-making:
  Spend visibility → Classification → Risk assessment → Trade-off evaluation → Opportunity selection → Executive synthesis
- Applied core procurement levers:
  - Long-tail vendor elimination
  - SaaS license optimization
  - Vendor consolidation
  - Strategic renegotiation
- Introduced a structured decision model:
  - Terminate | Consolidate | Optimize
- Evolved the system through execution:
  - Added **Business Function + Revenue Criticality**
  - Incorporated executon factors such as effort, switching cost, and time-to-value
  - Enabled execution-aware prioritization (not savings-only)
- Designed outputs for:
  - **CEO/CFO clarity (single-number savings)**
  - **Operational realism (feasibility + risk awareness)**

# AI-Orchestrated Workflow
  - **setup-workflow-assets:**     Bootstrap script that generates the initial workflow scaffold
  - **vendor-spend-workflow.md:**  Core AI reasoning engine with step-wise prompts
  - **vendor-rationalization.sh:** Orchestration layer that executes the workflow end-to-end

<img width="719" height="391" alt="image" src="https://github.com/user-attachments/assets/7915f9ac-481a-4576-8497-c773c2b99b7e" />

# Design Principles
  - **Separation of Concerns:**  AI reasoning (prompts) decoupled from execution (scripts)
  - **Closed Loop Workflow:**    Reason -> Validate -> Refine -> Persist
  - **Fucntionak Consistency over Determination:**  Consistent decision patterns and outputs across repeated runs
  - **Auditability & Observability:**  Step-level logging and traceable decision logic

# Methodology
  - Phase 1 — Workbook Inspection & Validation
  - Phase 2 — Spend Analysis & Concentration
  - Phase 3 — Optimization Analysis
  - Phase 4 — Executive Outputs
  - Phase 5 — Quality Assurance
  - Phase 6 — Finalization
  
# Tools & Environment
  - **AI Assistant:** Claude (Anthropic) via Claude Code CLI — used for structured reasoning and analysis
  - **Runtime:**      Node.js with xlsx (SheetJS) for controlled read/write
  - **Data Source:**  Vendor spend dataset *Google Sheets -> .xlxs)
  - **Output:**       Final output published as Google Sheet(Link); .xlxs version retained in repository
  
# Repository Structure

<img width="709" height="265" alt="image" src="https://github.com/user-attachments/assets/283e579e-38ef-4413-b53f-4ab81999606d" />



