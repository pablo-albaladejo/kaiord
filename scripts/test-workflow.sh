#!/bin/bash
# Helper script to test GitHub Actions workflows locally using act

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${RED}Error: 'act' is not installed${NC}"
    echo ""
    echo "Install act:"
    echo "  macOS:   brew install act"
    echo "  Linux:   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    echo "  Windows: choco install act-cli"
    echo ""
    echo "See: https://github.com/nektos/act"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo ""
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Function to display usage
usage() {
    echo -e "${BLUE}Usage:${NC} $0 [job-name] [options]"
    echo ""
    echo -e "${BLUE}Available jobs:${NC}"
    echo "  lint         - Run ESLint and Prettier checks"
    echo "  typecheck    - Run TypeScript type checking"
    echo "  test         - Run unit tests with coverage"
    echo "  round-trip   - Run round-trip tolerance tests"
    echo "  build        - Build affected packages"
    echo "  all          - Run all jobs (full CI workflow)"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  -v, --verbose    Verbose output"
    echo "  -n, --dry-run    Dry run (preview only)"
    echo "  -l, --list       List all available jobs"
    echo "  -h, --help       Show this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 round-trip              # Test round-trip job"
    echo "  $0 test --verbose          # Test with verbose output"
    echo "  $0 all --dry-run           # Preview full workflow"
    echo "  $0 --list                  # List all jobs"
}

# Parse arguments
JOB=""
VERBOSE=""
DRY_RUN=""
LIST=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE="-v"
            shift
            ;;
        -n|--dry-run)
            DRY_RUN="-n"
            shift
            ;;
        -l|--list)
            LIST=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        lint|typecheck|test|round-trip|build|all)
            JOB="$1"
            shift
            ;;
        *)
            echo -e "${RED}Error: Unknown option or job: $1${NC}"
            echo ""
            usage
            exit 1
            ;;
    esac
done

# List jobs if requested
if [ "$LIST" = true ]; then
    echo -e "${BLUE}Available jobs in CI workflow:${NC}"
    act pull_request -l
    exit 0
fi

# Check if job was specified
if [ -z "$JOB" ]; then
    echo -e "${RED}Error: No job specified${NC}"
    echo ""
    usage
    exit 1
fi

# Build act command
ACT_CMD="act pull_request"

if [ "$JOB" != "all" ]; then
    ACT_CMD="$ACT_CMD -j $JOB"
fi

if [ -n "$VERBOSE" ]; then
    ACT_CMD="$ACT_CMD $VERBOSE"
fi

if [ -n "$DRY_RUN" ]; then
    ACT_CMD="$ACT_CMD $DRY_RUN"
fi

# Display what we're running
echo -e "${GREEN}Running:${NC} $ACT_CMD"
echo ""

# Run act
eval $ACT_CMD

# Display result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Workflow test completed successfully${NC}"
else
    echo ""
    echo -e "${RED}❌ Workflow test failed${NC}"
    exit 1
fi
