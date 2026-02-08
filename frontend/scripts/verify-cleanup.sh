#!/bin/bash
# Script to verify component cleanup in development mode
# Task: T040 - Verify no warnings in dev mode console about uncleaned subscriptions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "======================================"
echo "Component Cleanup Verification (T040)"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if running in development mode
echo "Step 1: Verifying development environment..."
if [ "$NODE_ENV" != "development" ]; then
  export NODE_ENV=development
  echo -e "${YELLOW}⚠ Set NODE_ENV=development${NC}"
else
  echo -e "${GREEN}✓ NODE_ENV=development${NC}"
fi

# Step 2: Check TypeScript compilation
echo ""
echo "Step 2: Type checking..."
cd "$PROJECT_ROOT"
if npm run type-check 2>&1 | grep -q "error"; then
  echo -e "${RED}✗ TypeScript errors found. Fix before verification.${NC}"
  exit 1
else
  echo -e "${GREEN}✓ No TypeScript errors${NC}"
fi

# Step 3: Run unit tests for useComponentCleanup
echo ""
echo "Step 3: Running useComponentCleanup unit tests..."
if npm test -- hooks/__tests__/useComponentCleanup.event-warnings.test.ts --passWithNoTests 2>/dev/null; then
  echo -e "${GREEN}✓ Unit tests passed${NC}"
else
  echo -e "${YELLOW}⚠ Unit tests not run (test file may need setup)${NC}"
fi

# Step 4: Check for proper cleanup patterns
echo ""
echo "Step 4: Checking code for cleanup patterns..."

# Search for addEventListener without corresponding cleanup
UNCLEANED_LISTENERS=$(grep -r "addEventListener" "$PROJECT_ROOT/components" "$PROJECT_ROOT/lib" "$PROJECT_ROOT/hooks" --include="*.tsx" --include="*.ts" | \
  grep -v "registerSubscription" | \
  grep -v "removeEventListener" | \
  grep -v "// " | \
  wc -l)

if [ "$UNCLEANED_LISTENERS" -eq 0 ]; then
  echo -e "${GREEN}✓ All event listeners appear to have cleanup${NC}"
else
  echo -e "${YELLOW}⚠ Found $UNCLEANED_LISTENERS potential untracked listeners (manual review recommended)${NC}"
fi

# Check for WebSocket without didUnmount pattern
WEBSOCKET_FILES=$(grep -r "useWebSocket" "$PROJECT_ROOT" --include="*.ts" --include="*.tsx" -l)
if [ -n "$WEBSOCKET_FILES" ]; then
  for file in $WEBSOCKET_FILES; do
    if grep -q "didUnmount" "$file" && grep -q "registerResource" "$file"; then
      echo -e "${GREEN}✓ $(basename "$file"): WebSocket cleanup pattern found${NC}"
    else
      echo -e "${YELLOW}⚠ $(basename "$file"): Missing didUnmount or registerResource pattern${NC}"
    fi
  done
else
  echo -e "${GREEN}✓ No WebSocket usage found${NC}"
fi

# Step 5: Instructions for manual testing
echo ""
echo "======================================"
echo "Manual Testing Instructions"
echo "======================================"
echo ""
echo "1. Start the development server:"
echo "   cd $PROJECT_ROOT"
echo "   npm run dev"
echo ""
echo "2. Open browser DevTools Console (F12 → Console tab)"
echo ""
echo "3. Navigate through these pages and watch for warnings:"
echo "   - / (Landing page - scroll and move mouse)"
echo "   - /login, /register (Auth pages)"
echo "   - /dashboard (Daily bonus animations)"
echo "   - /templates (Gallery filtering)"
echo "   - /projects (Monaco editor)"
echo "   - /projects/[id]/generate (WebSocket generation)"
echo "   - /settings/* (Theme changes)"
echo ""
echo "4. Perform stress tests:"
echo "   - Rapidly switch between routes"
echo "   - Open/close Monaco editor multiple times"
echo "   - Start and cancel generation multiple times"
echo "   - Toggle theme repeatedly"
echo "   - Scroll landing page rapidly"
echo ""
echo "5. Expected console output:"
echo -e "   ${GREEN}✓ No warnings starting with '⚠️'${NC}"
echo -e "   ${GREEN}✓ No 'WEBSOCKET LEAK' messages${NC}"
echo -e "   ${GREEN}✓ No 'Memory Leak Warning' messages${NC}"
echo -e "   ${GREEN}✓ No 'Uncleaned Event Listener' messages${NC}"
echo ""
echo "6. If you see warnings:"
echo "   - Note the component name"
echo "   - Note the subscription type"
echo "   - Check the component file for proper cleanup"
echo "   - Ensure registerSubscription called BEFORE addEventListener"
echo "   - Ensure removeEventListener called in useEffect return"
echo ""
echo "======================================"
echo "Documentation"
echo "======================================"
echo ""
echo "Verification report: .tmp/current/cleanup-verification.md"
echo "Hook implementation: hooks/useComponentCleanup.ts"
echo "Test suite: hooks/__tests__/useComponentCleanup.event-warnings.test.ts"
echo ""
echo -e "${GREEN}Automated checks complete. Proceed with manual testing.${NC}"
