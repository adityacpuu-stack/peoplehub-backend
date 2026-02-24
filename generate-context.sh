#!/bin/bash
# ============================================================================
# generate-context.sh — Auto-generate AI context for vibecoding sessions
# ============================================================================
# Usage: ./generate-context.sh [output_file]
# Default output: .ai-context.md (di root project)
#
# Jalankan script ini SEBELUM mulai session Claude Code baru.
# Lalu bilang ke AI: "Baca .ai-context.md dan CLAUDE.md sebelum mulai."
#
# Tested on: macOS, Linux (Ubuntu/Debian)
# Dependencies: git, find, grep (standard tools)
# ============================================================================

set -euo pipefail

# --- Config ---
OUTPUT_FILE="${1:-.ai-context.md}"
MAX_GIT_LOG=15
MAX_MODIFIED_FILES=25
MAX_TODO_ITEMS=20
LOOKBACK_HOURS=48
CODE_EXTENSIONS="dart,py,js,ts,jsx,tsx,vue,go,rs,java,kt,swift,rb,php,cs,cpp,c,h"

# --- Colors (untuk terminal output, bukan file) ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
separator() {
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

section_header() {
    echo "## $1" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

check_git() {
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        echo -e "${YELLOW}⚠ Not a git repo. Git sections will be skipped.${NC}"
        return 1
    fi
    return 0
}

# --- Build Extension Pattern ---
# Converts "dart,py,js" → "-name '*.dart' -o -name '*.py' -o -name '*.js'"
build_find_pattern() {
    local IFS=','
    local first=true
    local pattern=""
    for ext in $CODE_EXTENSIONS; do
        if [ "$first" = true ]; then
            pattern="-name \"*.$ext\""
            first=false
        else
            pattern="$pattern -o -name \"*.$ext\""
        fi
    done
    echo "$pattern"
}

build_grep_include() {
    local IFS=','
    local pattern=""
    for ext in $CODE_EXTENSIONS; do
        pattern="$pattern --include=\"*.$ext\""
    done
    echo "$pattern"
}

# ============================================================================
# MAIN
# ============================================================================

echo -e "${BLUE}🔧 Generating AI context...${NC}"

# --- Header ---
cat > "$OUTPUT_FILE" << EOF
# 🤖 Auto-Generated AI Context
> Generated: $(date '+%Y-%m-%d %H:%M:%S')
> Project: $(basename "$(pwd)")
> Directory: $(pwd)

**Instruksi untuk AI:** File ini berisi konteks otomatis tentang state project saat ini.
Gunakan sebagai referensi, tapi selalu prioritaskan instruksi dari \`CLAUDE.md\` jika ada konflik.

EOF

# ============================================================================
# 1. PROJECT STRUCTURE
# ============================================================================
section_header "📁 Project Structure"

echo '```' >> "$OUTPUT_FILE"
if command -v tree &>/dev/null; then
    tree -L 2 -I 'node_modules|.git|__pycache__|.dart_tool|build|dist|.next|vendor|venv|.venv|env|.env|coverage|.gradle|.idea|*.pyc' --dirsfirst 2>/dev/null >> "$OUTPUT_FILE" || \
    find . -maxdepth 2 -not -path '*/\.*' -not -path '*/node_modules/*' | head -50 >> "$OUTPUT_FILE"
else
    find . -maxdepth 2 \
        -not -path '*/\.*' \
        -not -path '*/node_modules/*' \
        -not -path '*/__pycache__/*' \
        -not -path '*/build/*' \
        -not -path '*/dist/*' \
        -not -path '*/vendor/*' \
        -not -path '*/venv/*' \
        | sort | head -50 >> "$OUTPUT_FILE"
fi
echo '```' >> "$OUTPUT_FILE"

separator

# ============================================================================
# 2. TECH STACK DETECTION
# ============================================================================
section_header "🛠 Detected Tech Stack"

detect_stack() {
    local found=false

    # Package managers & frameworks
    [ -f "pubspec.yaml" ]       && echo "- **Flutter/Dart** (pubspec.yaml found)" >> "$OUTPUT_FILE" && found=true
    [ -f "package.json" ]       && echo "- **Node.js** (package.json found)" >> "$OUTPUT_FILE" && found=true
    [ -f "requirements.txt" ]   && echo "- **Python** (requirements.txt found)" >> "$OUTPUT_FILE" && found=true
    [ -f "pyproject.toml" ]     && echo "- **Python** (pyproject.toml found)" >> "$OUTPUT_FILE" && found=true
    [ -f "Pipfile" ]            && echo "- **Python/Pipenv** (Pipfile found)" >> "$OUTPUT_FILE" && found=true
    [ -f "go.mod" ]             && echo "- **Go** (go.mod found)" >> "$OUTPUT_FILE" && found=true
    [ -f "Cargo.toml" ]         && echo "- **Rust** (Cargo.toml found)" >> "$OUTPUT_FILE" && found=true
    [ -f "Gemfile" ]            && echo "- **Ruby** (Gemfile found)" >> "$OUTPUT_FILE" && found=true
    [ -f "composer.json" ]      && echo "- **PHP** (composer.json found)" >> "$OUTPUT_FILE" && found=true
    [ -f "pom.xml" ]            && echo "- **Java/Maven** (pom.xml found)" >> "$OUTPUT_FILE" && found=true
    [ -f "build.gradle" ]       && echo "- **Java/Kotlin/Gradle** (build.gradle found)" >> "$OUTPUT_FILE" && found=true

    # Frameworks
    [ -f "next.config.js" ] || [ -f "next.config.mjs" ] || [ -f "next.config.ts" ] && \
        echo "- **Next.js**" >> "$OUTPUT_FILE" && found=true
    [ -f "nuxt.config.ts" ] || [ -f "nuxt.config.js" ] && \
        echo "- **Nuxt.js**" >> "$OUTPUT_FILE" && found=true
    [ -f "angular.json" ]       && echo "- **Angular**" >> "$OUTPUT_FILE" && found=true
    [ -f "svelte.config.js" ]   && echo "- **SvelteKit**" >> "$OUTPUT_FILE" && found=true

    # Infra & config
    [ -f "Dockerfile" ]         && echo "- **Docker** (Dockerfile found)" >> "$OUTPUT_FILE" && found=true
    [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ] && \
        echo "- **Docker Compose**" >> "$OUTPUT_FILE" && found=true
    [ -f "terraform.tf" ] || [ -d ".terraform" ] && \
        echo "- **Terraform**" >> "$OUTPUT_FILE" && found=true
    [ -f ".env" ]               && echo "- **Environment vars** (.env found)" >> "$OUTPUT_FILE" && found=true
    [ -f "CLAUDE.md" ]          && echo "- **Claude Code** (CLAUDE.md found)" >> "$OUTPUT_FILE" && found=true

    if [ "$found" = false ]; then
        echo "_No known tech stack detected._" >> "$OUTPUT_FILE"
    fi
}

detect_stack

separator

# ============================================================================
# 3. GIT CONTEXT
# ============================================================================
if check_git; then

    section_header "🌿 Git Status"

    echo "**Branch:** \`$(git branch --show-current 2>/dev/null || echo 'detached')\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # Uncommitted changes
    CHANGES=$(git status --short 2>/dev/null)
    if [ -n "$CHANGES" ]; then
        echo "**Uncommitted Changes:**" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "$CHANGES" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
    else
        echo "_Working tree clean_ ✅" >> "$OUTPUT_FILE"
    fi

    separator

    # --- Recent Commits ---
    section_header "📜 Recent Commits (last $MAX_GIT_LOG)"

    echo '```' >> "$OUTPUT_FILE"
    git log --oneline --decorate -"$MAX_GIT_LOG" 2>/dev/null >> "$OUTPUT_FILE" || echo "No commits yet" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"

    separator

    # --- Recent Tags ---
    TAGS=$(git tag --sort=-creatordate 2>/dev/null | head -5)
    if [ -n "$TAGS" ]; then
        section_header "🏷 Recent Tags"
        echo '```' >> "$OUTPUT_FILE"
        echo "$TAGS" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        separator
    fi

    # --- Branches ---
    section_header "🔀 Active Branches"

    echo '```' >> "$OUTPUT_FILE"
    git branch -a --sort=-committerdate 2>/dev/null | head -10 >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"

    separator
fi

# ============================================================================
# 4. RECENTLY MODIFIED FILES
# ============================================================================
section_header "📝 Recently Modified Files (last ${LOOKBACK_HOURS}h)"

echo '```' >> "$OUTPUT_FILE"
# Use find with -mmin for cross-platform compatibility
MMIN=$((LOOKBACK_HOURS * 60))
eval "find . -type f \( $(build_find_pattern) \) -mmin -${MMIN} \
    -not -path '*/\.*' \
    -not -path '*/node_modules/*' \
    -not -path '*/build/*' \
    -not -path '*/dist/*' \
    -not -path '*/__pycache__/*' \
    -not -path '*/vendor/*' \
    2>/dev/null | sort | head -${MAX_MODIFIED_FILES}" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

separator

# ============================================================================
# 5. TODO / FIXME / HACK ITEMS
# ============================================================================
section_header "📌 TODO / FIXME / HACK Items"

echo '```' >> "$OUTPUT_FILE"
eval "grep -rn 'TODO\|FIXME\|HACK\|XXX\|WORKAROUND' $(build_grep_include) \
    --exclude-dir=node_modules \
    --exclude-dir=build \
    --exclude-dir=dist \
    --exclude-dir=vendor \
    --exclude-dir=venv \
    --exclude-dir=.git \
    . 2>/dev/null | head -${MAX_TODO_ITEMS}" >> "$OUTPUT_FILE" || echo "No TODO/FIXME items found" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

separator

# ============================================================================
# 6. EXISTING DOCS CHECK
# ============================================================================
section_header "📚 Existing Documentation"

check_doc() {
    if [ -f "$1" ]; then
        echo "- ✅ \`$1\` exists" >> "$OUTPUT_FILE"
    else
        echo "- ❌ \`$1\` not found" >> "$OUTPUT_FILE"
    fi
}

check_doc "CLAUDE.md"
check_doc "README.md"
check_doc "docs/ARCHITECTURE.md"
check_doc "docs/PROGRESS.md"
check_doc "docs/DECISIONS.md"
check_doc "docs/SESSION_LOG.md"
check_doc ".env.example"

separator

# ============================================================================
# 7. QUICK STATS
# ============================================================================
section_header "📊 Quick Stats"

# Count files by extension
echo "**Files by type:**" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"
IFS=',' read -ra EXTS <<< "$CODE_EXTENSIONS"
for ext in "${EXTS[@]}"; do
    count=$(find . -name "*.$ext" \
        -not -path '*/node_modules/*' \
        -not -path '*/build/*' \
        -not -path '*/dist/*' \
        -not -path '*/.git/*' \
        -not -path '*/vendor/*' \
        2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
        printf "  %-10s %s files\n" ".$ext" "$count" >> "$OUTPUT_FILE"
    fi
done
echo '```' >> "$OUTPUT_FILE"

# Lines of code (rough estimate)
if command -v wc &>/dev/null; then
    echo "" >> "$OUTPUT_FILE"
    TOTAL_LOC=$(eval "find . -type f \( $(build_find_pattern) \) \
        -not -path '*/node_modules/*' \
        -not -path '*/build/*' \
        -not -path '*/dist/*' \
        -not -path '*/.git/*' \
        -not -path '*/vendor/*' \
        2>/dev/null" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    echo "**Estimated total LOC:** ~${TOTAL_LOC:-0}" >> "$OUTPUT_FILE"
fi

# ============================================================================
# FOOTER
# ============================================================================
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
cat >> "$OUTPUT_FILE" << 'EOF'
## 🚀 Quick Start for AI

```
Baca file ini + CLAUDE.md, lalu:
1. Cek "Uncommitted Changes" — ada kerjaan yang belum di-commit?
2. Cek "TODO/FIXME" — ada yang urgent?
3. Cek "Session Log" — ada handoff dari session sebelumnya?
4. Tanya user mau ngerjain apa hari ini.
```
EOF

# --- Done ---
echo -e "${GREEN}✅ Context generated → ${OUTPUT_FILE}${NC}"
echo -e "${BLUE}📋 Size: $(wc -c < "$OUTPUT_FILE" | tr -d ' ') bytes${NC}"
echo ""
echo -e "${YELLOW}💡 Mulai session Claude Code dengan:${NC}"
echo -e "   ${GREEN}\"Baca .ai-context.md dan CLAUDE.md sebelum mulai kerja.\"${NC}"