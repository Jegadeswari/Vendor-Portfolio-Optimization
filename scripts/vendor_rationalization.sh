#!/usr/bin/env bash
# =============================================================================
# Vendor Spend Strategy Assessment — AI-Orchestrated Vendor Rationalization
# =============================================================================
#
# Usage:
#   bash scripts/vendor_rationalization.sh
#
# Prerequisites:
#   - Claude Code CLI installed and authenticated   (claude --version)
#   - Node.js available                             (node --version)
#   - npm xlsx package installed locally            (npm list xlsx)
#
# This script orchestrates 16 structured steps using Claude Code CLI in
# non-interactive mode. All workflow prompts are defined in:
#   prompts/vendor-spend-workflow.md
#
# This script is responsible only for:
#   - locating the repository root
#   - ensuring the logs directory exists
#   - extracting each step's prompt from the workflow file
#   - executing each step via Claude Code CLI
#   - capturing execution logs
#
# The script contains no embedded workflow prompts.
#
# Outputs:
#   - Updated Excel workbook in outputs/
#   - Step-by-step logs in logs/
# =============================================================================

set -uo pipefail

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

WORKFLOW_START=$(date +%s)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WORKBOOK_REL="outputs/A - TEMPLATE - RWA - Vendor Spend Strategy (R Jegadeswari).xlsx"
WORKBOOK="$ROOT_DIR/$WORKBOOK_REL"
WORKFLOW="$ROOT_DIR/prompts/vendor-spend-workflow.md"
LOGS="$ROOT_DIR/logs"

TOTAL_STEPS=16

mkdir -p "$LOGS"

CHECKPOINT="$LOGS/.completed_steps"
touch "$CHECKPOINT"

# ---------------------------------------------------------------------------
# RUN QUICK CHECK
# ---------------------------------------------------------------------------

if [[ -f "$SCRIPT_DIR/quick-check.sh" ]]; then
  echo "Running quick pre-run validation..."
  bash "$SCRIPT_DIR/quick-check.sh" || {
    echo "Quick check failed. Fix issues before running workflow."
    exit 1
  }
fi

# ---------------------------------------------------------------------------
# PREFLIGHT CHECKS
# ---------------------------------------------------------------------------

if [[ ! -f "$WORKBOOK" ]]; then
  echo -e "${RED}ERROR: Workbook not found at: $WORKBOOK${NC}"
  exit 1
fi

if [[ ! -f "$WORKFLOW" ]]; then
  echo -e "${RED}ERROR: Workflow prompt file not found at: $WORKFLOW${NC}"
  exit 1
fi

if ! command -v claude &>/dev/null; then
  echo -e "${RED}ERROR: Claude Code CLI not found. Install it and authenticate first.${NC}"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}ERROR: Node.js not found. Install Node.js to enable Excel read/write.${NC}"
  exit 1
fi

# ---------------------------------------------------------------------------
# STEP EXECUTION HELPERS
# ---------------------------------------------------------------------------

# Extract a step's prompt from the workflow file and substitute ${WORKBOOK}.
# Usage: extract_step <step_number>
extract_step() {
  export WORKBOOK
  local step
 #step=$(printf "%02d" "$1")    #RJEGA
  step=$(printf "%02d" $(( 10#$1 )))
  awk "/<!-- STEP:${step} -->/{found=1; next} /<!-- \/STEP:${step} -->/{found=0} found{print}" "$WORKFLOW" \
    | envsubst '${WORKBOOK}'
}

# Run a single step: extract prompt, invoke Claude Code CLI, tee to log.
# Usage: run_step <step_number> <logfile> <description> [json_output_file]
run_step() {
  local step
  #step=$(printf "%02d" "$1")    #RJEGA
  step=$(printf "%02d" $(( 10#$1 )))
  local logfile="$2"
  local description="$3"
  local jsonfile="${4:-}"

  if grep -qx "STEP_${step}_DONE" "$CHECKPOINT" 2>/dev/null; then
    echo "[$(timestamp)] STEP ${step} already completed — skipping"
    return 0
  fi

  echo "------------------------------------------------------------"
  echo -e "${YELLOW}[$(timestamp)] >>> STEP ${step}/${TOTAL_STEPS} START: ${description}${NC}"

  local start_time
  start_time=$(date +%s)

  local prompt
  prompt="$(extract_step "$step")"

  if [[ -z "$prompt" ]]; then
    echo -e "${RED}ERROR: STEP ${step} prompt not found in $WORKFLOW${NC}"
    exit 1
  fi

  # Run Claude Code CLI in non-interactive mode
  printf "%s" "$prompt" | claude \
    --allowed-tools Bash \
    --output-format stream-json \
    --verbose \
    2>&1 \
    | tee "$LOGS/${logfile}.raw" \
    | node -e "
      const rl = require('readline').createInterface({ input: process.stdin });
      rl.on('line', line => {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'assistant' && Array.isArray(obj.message?.content))
            obj.message.content.forEach(b => { if (b.type === 'text') process.stdout.write(b.text); });
        } catch(e) {}
      });
    " | tee "$LOGS/$logfile"

  # Extract and validate JSON output if required
  if [[ -n "$jsonfile" ]]; then
    local JSON_PATH="$LOGS/$jsonfile"
    # JSON_PATH_WIN=$(echo "$JSON_PATH" | sed 's|^/\([a-zA-Z]\)/|\1:/|; s|/|\\\\|g')
    JSON_PATH_WIN=$(echo "$JSON_PATH" | sed 's|^/\([a-zA-Z]\)/|\1:/|')

    # Claude consistently writes the JSON to the outputs folder
    OUTPUTS_JSON="$ROOT_DIR/outputs/step05_vendors.json"
    NODE_TMPDIR=$(node -e "console.log(require('os').tmpdir())" 2>/dev/null | tr '\\' '/')
    TEMP_JSON="${NODE_TMPDIR}/step05_vendors.json"

    if [[ -f "$OUTPUTS_JSON" ]] && [[ -s "$OUTPUTS_JSON" ]]; then
      cp "$OUTPUTS_JSON" "$JSON_PATH"
      rm -f "$OUTPUTS_JSON"
      echo "[$(timestamp)] Found Step 05 JSON in outputs/"
    elif [[ -f "$TEMP_JSON" ]] && [[ -s "$TEMP_JSON" ]]; then
      cp "$TEMP_JSON" "$JSON_PATH"
      rm -f "$TEMP_JSON"
      echo "[$(timestamp)] Found Step 05 JSON in temp/"
    else
      echo -e "${RED}ERROR: step05_vendors.json not found in outputs/ or temp/${NC}"
      sed -i "/STEP_${step}_DONE/d" "$CHECKPOINT"
      exit 1
    fi

    # Validate JSON
    if ! node -e "const fs=require('fs');JSON.parse(fs.readFileSync('${JSON_PATH_WIN}','utf8').trim())" 2>/dev/null; then
#    if ! node -e "const fs=require('fs');JSON.parse(fs.readFileSync('$JSON_PATH','utf8').trim())" 2>/dev/null; then
      echo -e "${RED}ERROR: Invalid JSON returned by Claude for STEP ${step}${NC}"
      echo "Check file: $JSON_PATH"
      # Remove this step from checkpoint so it re-runs on next attempt
      sed -i "/STEP_${step}_DONE/d" "$CHECKPOINT"
      exit 1
    fi

    local record_count
    # record_count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$JSON_PATH','utf8')).length)")
    record_count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${JSON_PATH_WIN}','utf8')).length)")
    echo "[$(timestamp)] JSON records captured: $record_count"
    echo "[$(timestamp)] JSON output written to: $LOGS/$jsonfile"
  fi

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  echo ""
  echo -e "${GREEN}[$(timestamp)] >>> STEP ${step} COMPLETE (Duration: ${duration}s)${NC}"
  echo "[$(timestamp)] Log written to: $LOGS/$logfile"
  echo "STEP_${step}_DONE" >> "$CHECKPOINT"
  echo ""
}

# ---------------------------------------------------------------------------
# BANNER
# ---------------------------------------------------------------------------

echo "============================================================"
echo " Vendor Spend Strategy Assessment — Vendor Rationalization"
echo "============================================================"
echo " Workbook : $WORKBOOK"
echo " Prompts  : $WORKFLOW"
echo " Logs     : $LOGS"
echo " Started  : $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# PHASE 1 — Workbook Inspection
# ---------------------------------------------------------------------------

run_step "01" "step01_inspect.log"   "Inspecting workbook structure"
run_step "02" "step02_template.log"  "Reading template instruction constraints"

# ---------------------------------------------------------------------------
# PHASE 2 — Vendor Spend Analysis
# ---------------------------------------------------------------------------

run_step "03" "step03_spend_analysis.log"  "Performing vendor spend analysis"
run_step "04" "step04_classify.log"        "Classifying vendor categories and departments"

# Step 05 produces a JSON array used to update the workbook via Node.js
run_step "05" "step05_populate.log" "Populating vendor analysis columns" "step05_vendor_classification.json"

STEP05_JSON="$LOGS/step05_vendor_classification.json"

if [[ ! -s "$STEP05_JSON" ]]; then
  echo -e "${RED}ERROR: STEP 05 JSON output is empty or missing: $STEP05_JSON${NC}"
  exit 1
fi

# Remove stale temp file from any previously interrupted run
TEMP_WORKBOOK="${WORKBOOK%.xlsx}.tmp.xlsx"
if [[ -f "$TEMP_WORKBOOK" ]]; then
  echo -e "${YELLOW}WARNING: Stale temp workbook found — removing: $TEMP_WORKBOOK${NC}"
  rm -f "$TEMP_WORKBOOK"
fi

echo -e "${YELLOW}[$(timestamp)] >>> Writing STEP 05 results to workbook${NC}"

node "$ROOT_DIR/scripts/update-vendor-analysis-sheet.js" \
  "$WORKBOOK" \
  "$STEP05_JSON"

echo -e "${GREEN}[$(timestamp)] >>> Vendor analysis columns updated in workbook${NC}"
echo ""

run_step "06" "step06_rationale.log" "Capturing recommendation rationale"

# ---------------------------------------------------------------------------
# PHASE 3 — Optimization Analysis
# ---------------------------------------------------------------------------

run_step "07" "step07_duplicates.log"     "Detecting duplicate vendor categories"
run_step "08" "step08_scoring.log"        "Scoring vendors by strategic importance"
run_step "09" "step09_opportunities.log"  "Identifying top 3 cost optimization opportunities"
run_step "10" "step10_metrics.log"        "Recording analysis metrics for audit trail"

# ---------------------------------------------------------------------------
# PHASE 4 — Executive Outputs
# ---------------------------------------------------------------------------

run_step "11" "step11_methodology.log"  "Populating Methodology sheet"
run_step "12" "step12_memo.log"         "Generating CEO/CFO executive memo"

# ---------------------------------------------------------------------------
# PHASE 5 — Quality Assurance
# ---------------------------------------------------------------------------

run_step "13" "step13_validation.log"   "Validating all vendor rows and outputs"
run_step "14" "step14_review.log"       "Reviewing and improving analysis quality"
run_step "15" "step15_confidence.log"   "Running confidence and review check"

###### RJEGA >> UNCOMMENT THE BELOW IF YOU WANT TO BE STOPPED AFTER STEP15  FOR HUMARN REVIEW
# # Stop pipeline if Step 15 flagged vendors for human review
# if grep -qi "human review recommended" "$LOGS/step15_confidence.log" 2>/dev/null; then
#   echo -e "${YELLOW}============================================================${NC}"
#   echo -e "${YELLOW} WARNING: Step 15 flagged vendors for human review.${NC}"
#   echo -e "${YELLOW} Check: $LOGS/step15_confidence.log${NC}"
#   echo -e "${YELLOW} Fix flagged vendors in the workbook, then re-run the script.${NC}"
#   echo -e "${YELLOW} Step 15 is marked done — pipeline will resume from Step 16.${NC}"
#   echo -e "${YELLOW}============================================================${NC}"
#   exit 1
# fi

# ---------------------------------------------------------------------------
# PHASE 6 — Finalization
# ---------------------------------------------------------------------------

run_step "16" "step16_save.log" "Confirming final workbook state"

# ---------------------------------------------------------------------------
# GENERATE WORD DOCUMENT — CEO/CFO Recommendations
# ---------------------------------------------------------------------------

echo -e "${YELLOW}[$(timestamp)] >>> Generating CEOCFORecommendations.docx${NC}"

npm list docx --prefix "$ROOT_DIR" &>/dev/null || npm install docx --prefix "$ROOT_DIR" --save-quiet

node "$ROOT_DIR/scripts/generate-ceocfo-doc.js" \
  "$WORKBOOK" \
  "$ROOT_DIR/outputs/CEOCFORecommendations.docx"

echo -e "${GREEN}[$(timestamp)] >>> CEOCFORecommendations.docx written to outputs/${NC}"
echo ""

# ---------------------------------------------------------------------------
# RESTORE FORMATTING FROM TEMPLATE
# ---------------------------------------------------------------------------

echo -e "${YELLOW}[$(timestamp)] >>> Restoring formatting from template${NC}"

python "$ROOT_DIR/scripts/restore-formatting.py" \
  "$ROOT_DIR/data/A - TEMPLATE - RWA - Vendor Spend Strategy (NAME).xlsx" \
  "$WORKBOOK"

echo -e "${GREEN}[$(timestamp)] >>> Formatting restored${NC}"
echo ""

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------

WORKFLOW_END=$(date +%s)
TOTAL_RUNTIME=$((WORKFLOW_END - WORKFLOW_START))
MIN=$((TOTAL_RUNTIME / 60))
SEC=$((TOTAL_RUNTIME % 60))

echo "============================================================"
echo " Assessment complete."
echo " Output  : $WORKBOOK"
echo " Logs    : $LOGS/"
echo " Finished: $(date '+%Y-%m-%d %H:%M:%S')"
echo " Total Runtime: ${MIN}m ${SEC}s"
echo "============================================================"