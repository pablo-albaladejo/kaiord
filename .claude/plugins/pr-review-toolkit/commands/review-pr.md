---
description: Run comprehensive PR review with specialized agents
---

## Comprehensive PR Review Command

This command orchestrates multiple specialized review agents to perform a thorough pull request analysis.

## Usage

```bash
/pr-review-toolkit:review-pr
```

Optional: Specify which aspects to review:

```bash
/pr-review-toolkit:review-pr comments tests errors
```

## Review Aspects

Available review aspects (use agent names):

- `comment-analyzer` - Check comment accuracy and documentation
- `pr-test-analyzer` - Analyze test coverage and quality
- `silent-failure-hunter` - Find error handling issues
- `type-design-analyzer` - Review type design quality
- `code-reviewer` - General code quality review
- `code-simplifier` - Identify simplification opportunities

## What It Does

1. **Identifies files changed** in the current branch
2. **Runs selected agents** (or all agents if none specified)
3. **Aggregates findings** from all agents
4. **Provides actionable feedback** with file/line references

## Example Workflows

### Full comprehensive review:

```bash
/pr-review-toolkit:review-pr
```

### Targeted review after addressing feedback:

```bash
/pr-review-toolkit:review-pr tests errors
```

### Before committing:

```bash
/pr-review-toolkit:review-pr code-reviewer silent-failure-hunter
```

## Agent Execution

Agents run in parallel for efficiency. Each agent:

- Analyzes only changed files
- Provides confidence scores
- References specific lines
- Suggests improvements

## Output Format

Results are organized by agent with:

- **Agent name** and focus area
- **Findings** with severity/confidence scores
- **File paths** and line numbers
- **Recommendations** for fixes

## Tips

- Run before creating PR for best results
- Use targeted reviews to verify specific fixes
- Address high-confidence/critical issues first
- Re-run after making changes to verify improvements

## Requirements

- Must be in a git repository
- Changes should be committed or staged
- Works best with clear PR scope
