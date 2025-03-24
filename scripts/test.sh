#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Running LilySEO Tests${NC}"
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${RED}node_modules not found!${NC}"
  echo -e "Running ${GREEN}npm install${NC}..."
  npm install
fi

# Run linting first
echo -e "\n${BLUE}Step 1: Running ESLint${NC}"
npm run lint
LINT_RESULT=$?

if [ $LINT_RESULT -ne 0 ]; then
  echo -e "${RED}ESLint found issues. Please fix them before continuing.${NC}"
  exit 1
else
  echo -e "${GREEN}ESLint passed successfully!${NC}"
fi

# Type checking
echo -e "\n${BLUE}Step 2: Running TypeScript Check${NC}"
npx tsc --noEmit
TS_RESULT=$?

if [ $TS_RESULT -ne 0 ]; then
  echo -e "${RED}TypeScript errors found. Please fix them before continuing.${NC}"
  exit 1
else
  echo -e "${GREEN}TypeScript check passed successfully!${NC}"
fi

# Run tests with coverage
echo -e "\n${BLUE}Step 3: Running Jest Tests${NC}"
npm test -- --coverage

TEST_RESULT=$?
if [ $TEST_RESULT -ne 0 ]; then
  echo -e "${RED}Tests failed.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed successfully!${NC}"
fi

echo -e "\n${GREEN}All checks completed successfully!${NC}"
exit 0 