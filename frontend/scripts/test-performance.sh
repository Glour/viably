#!/bin/bash

# Performance Testing Script
# Automates common performance testing workflows

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$FRONTEND_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if dev server is running
check_dev_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Main menu
show_menu() {
    clear
    print_header "Viably Performance Testing"
    echo ""
    echo "1) Start dev server and open test page"
    echo "2) Run type check (verify no errors)"
    echo "3) Open performance test page (manual testing)"
    echo "4) Run bundle size analysis"
    echo "5) View performance documentation"
    echo "6) Clean test data"
    echo "0) Exit"
    echo ""
    read -p "Select option: " choice
    case $choice in
        1) start_dev_and_open ;;
        2) run_type_check ;;
        3) open_test_page ;;
        4) run_bundle_analysis ;;
        5) view_docs ;;
        6) clean_test_data ;;
        0) exit 0 ;;
        *)
            print_error "Invalid option"
            sleep 2
            show_menu
            ;;
    esac
}

start_dev_and_open() {
    print_header "Starting Dev Server"

    if check_dev_server; then
        print_info "Dev server already running on http://localhost:3000"
    else
        print_info "Starting dev server..."
        npm run dev &
        DEV_PID=$!

        # Wait for server to start
        print_info "Waiting for server to start..."
        for i in {1..30}; do
            if check_dev_server; then
                print_success "Dev server started"
                break
            fi
            sleep 1
        done

        if ! check_dev_server; then
            print_error "Failed to start dev server"
            kill $DEV_PID 2>/dev/null
            read -p "Press Enter to continue..."
            show_menu
            return
        fi
    fi

    print_info "Opening performance test page..."

    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000/dev/performance
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000/dev/performance 2>/dev/null || \
        sensible-browser http://localhost:3000/dev/performance 2>/dev/null || \
        print_info "Please open http://localhost:3000/dev/performance manually"
    else
        print_info "Please open http://localhost:3000/dev/performance manually"
    fi

    print_success "Test page should open in your browser"
    echo ""
    print_info "Instructions:"
    echo "  1. Select test type (templates/projects-grid/projects-list)"
    echo "  2. Choose item count (recommend 500 for primary test)"
    echo "  3. Click 'Generate Test Data'"
    echo "  4. Click 'Run Performance Test'"
    echo "  5. Review results (target: >30 FPS avg, >30 FPS min)"
    echo "  6. Download report if needed"
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

run_type_check() {
    print_header "Running Type Check"

    if npm run type-check; then
        print_success "Type check passed"
    else
        print_error "Type check failed"
        print_info "Fix type errors before performance testing"
    fi

    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

open_test_page() {
    print_header "Opening Performance Test Page"

    if ! check_dev_server; then
        print_error "Dev server not running"
        print_info "Start dev server first (option 1)"
        read -p "Press Enter to continue..."
        show_menu
        return
    fi

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000/dev/performance
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000/dev/performance 2>/dev/null || \
        sensible-browser http://localhost:3000/dev/performance 2>/dev/null || \
        print_info "Please open http://localhost:3000/dev/performance manually"
    else
        print_info "Please open http://localhost:3000/dev/performance manually"
    fi

    print_success "Opening http://localhost:3000/dev/performance"
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

run_bundle_analysis() {
    print_header "Running Bundle Size Analysis"

    print_info "Building production bundle..."
    if npm run build; then
        print_success "Build completed"

        if [ -f .next/analyze/client.html ]; then
            print_info "Opening bundle analyzer..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open .next/analyze/client.html
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open .next/analyze/client.html 2>/dev/null
            fi
        else
            print_info "Bundle analyzer not configured"
            print_info "Install @next/bundle-analyzer to enable analysis"
        fi
    else
        print_error "Build failed"
    fi

    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

view_docs() {
    print_header "Performance Testing Documentation"

    DOC_PATH="../.tmp/current/performance-test-guide.md"

    if [ -f "$DOC_PATH" ]; then
        if command -v bat > /dev/null 2>&1; then
            bat "$DOC_PATH"
        elif command -v less > /dev/null 2>&1; then
            less "$DOC_PATH"
        else
            cat "$DOC_PATH"
        fi
    else
        print_error "Documentation not found at $DOC_PATH"
    fi

    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

clean_test_data() {
    print_header "Cleaning Test Data"

    print_info "Clearing sessionStorage (requires browser)..."
    print_info "Open browser console and run: sessionStorage.clear()"

    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Start script
if [ "$1" == "--ci" ]; then
    # CI mode: run checks only
    print_header "CI Performance Checks"
    run_type_check
    exit $?
else
    # Interactive mode
    show_menu
fi
