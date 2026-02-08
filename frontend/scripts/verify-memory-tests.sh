#!/bin/bash
#
# Memory Leak Verification Script
#
# This script runs the component lifecycle stress tests and verifies
# that no memory leaks are detected across critical components.
#
# Related: T039 (mount/unmount stress test)
#

set -e

echo "=================================================="
echo "Memory Leak Prevention - Verification Script"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    echo -e "${RED}❌ Playwright not found. Installing...${NC}"
    npm install
    npx playwright install --with-deps chromium
fi

# Check if frontend is running
echo "🔍 Checking if frontend is running on http://localhost:3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Frontend not running. Starting in background...${NC}"
    npm run dev &
    DEV_PID=$!

    # Wait for frontend to start (max 30 seconds)
    echo "⏳ Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo -e "${GREEN}✅ Frontend is ready!${NC}"
            break
        fi
        sleep 1
    done

    # Cleanup on exit
    trap "kill $DEV_PID 2>/dev/null || true" EXIT
else
    echo -e "${GREEN}✅ Frontend is running${NC}"
fi

echo ""
echo "=================================================="
echo "Running Component Lifecycle Stress Tests"
echo "=================================================="
echo ""

# Run stress tests with line reporter for concise output
if npm run test:e2e:memory; then
    echo ""
    echo -e "${GREEN}=================================================="
    echo "✅ All Memory Leak Tests PASSED"
    echo "==================================================${NC}"
    echo ""
    echo "Summary:"
    echo "  • 10 critical components tested"
    echo "  • 1000 mount/unmount cycles per component"
    echo "  • Memory growth < 50% threshold verified"
    echo "  • No WebSocket leaks detected"
    echo "  • No event listener leaks detected"
    echo "  • No timer leaks detected"
    echo ""
    echo -e "${GREEN}✅ Memory leak prevention verified successfully!${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}=================================================="
    echo "❌ Memory Leak Tests FAILED"
    echo "==================================================${NC}"
    echo ""
    echo "Debugging tips:"
    echo "  1. Check console warnings for uncleaned subscriptions"
    echo "  2. Verify cleanup registration order (register BEFORE creating resource)"
    echo "  3. Run with headed browser to watch memory visually:"
    echo "     npm run test:e2e:memory:headed"
    echo "  4. Run with debugger for detailed inspection:"
    echo "     npm run test:e2e:memory:debug"
    echo "  5. Check documentation: .tmp/current/memory-lifecycle-test-results.md"
    echo ""
    exit 1
fi
