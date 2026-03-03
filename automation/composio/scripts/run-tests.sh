#!/bin/bash

# PuraEstate Test Suite Runner
# Runs all tests with coverage reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="tests"
COVERAGE_DIR="coverage"
MIN_COVERAGE=80

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PuraEstate Test Suite Runner${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Parse arguments
TEST_TYPE=${1:-all}
WATCH_MODE=${2:-false}

# Function to run specific test suite
run_tests() {
    local test_suite=$1
    local pattern=$2

    echo -e "${YELLOW}Running ${test_suite} tests...${NC}"

    if [ "$WATCH_MODE" = "watch" ]; then
        npm run test:watch -- --testPathPattern="${pattern}"
    else
        npm run test -- --testPathPattern="${pattern}" --coverage
    fi
}

# Function to print test results
print_results() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Test Results${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

    if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then
        echo -e "${GREEN}✓ Coverage report generated${NC}"
        echo "  Location: $COVERAGE_DIR/coverage-summary.json"
        echo "  HTML report: $COVERAGE_DIR/lcov-report/index.html"
    fi
}

# Main test execution
case $TEST_TYPE in
    unit)
        echo -e "${YELLOW}Running unit tests only...${NC}"
        run_tests "Unit" "(config|logger)"
        ;;

    integration)
        echo -e "${YELLOW}Running integration tests only...${NC}"
        run_tests "Integration" "integration"
        ;;

    e2e)
        echo -e "${YELLOW}Running E2E tests only...${NC}"
        run_tests "E2E" "e2e"
        ;;

    security)
        echo -e "${YELLOW}Running security tests only...${NC}"
        run_tests "Security" "security"
        ;;

    performance)
        echo -e "${YELLOW}Running performance tests only...${NC}"
        run_tests "Performance" "performance"
        ;;

    watch)
        echo -e "${YELLOW}Running tests in watch mode...${NC}"
        npm run test:watch
        ;;

    all)
        echo -e "${YELLOW}Running all tests...${NC}"
        npm run test -- --coverage --testTimeout=10000

        # Check coverage
        if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then
            COVERAGE=$(grep -o '"lines".*"pct": [0-9]*' "$COVERAGE_DIR/coverage-summary.json" | head -1 | grep -o '[0-9]*' | tail -1)

            echo -e "\n${BLUE}Coverage: ${COVERAGE}%${NC}"

            if [ "$COVERAGE" -lt "$MIN_COVERAGE" ]; then
                echo -e "${RED}✗ Coverage below threshold (${MIN_COVERAGE}%)${NC}"
                exit 1
            else
                echo -e "${GREEN}✓ Coverage meets threshold${NC}"
            fi
        fi
        ;;

    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo "Usage: $0 [unit|integration|e2e|security|performance|watch|all] [watch]"
        exit 1
        ;;
esac

print_results

echo -e "\n${GREEN}✓ Test execution completed${NC}\n"
