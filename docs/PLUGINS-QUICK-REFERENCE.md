# Claude Code Plugins - Quick Reference

## Quick Command Reference

### Commit Commands

```bash
/commit                 # Create a commit with auto-generated message
/commit-push-pr         # Commit + push + create PR (with changeset)
/clean_gone            # Clean up deleted remote branches
```

### PR Review

```bash
/pr-review-toolkit:review-pr                    # Full comprehensive review
/pr-review-toolkit:review-pr tests errors       # Targeted review
```

**Or use natural language:**

```
"Check test coverage"           → pr-test-analyzer
"Review error handling"         → silent-failure-hunter
"Are my comments accurate?"     → comment-analyzer
"Review type design"            → type-design-analyzer
"Simplify this code"            → code-simplifier
"Review my changes"             → code-reviewer
```

---

## Plugin Summary

### 1. commit-commands ⚡

**Auto-generates commit messages and streamlines git workflow**

- Follows conventional commits
- Includes changeset creation
- Creates PRs with proper descriptions

### 2. security-guidance 🔒

**Blocks dangerous code patterns before you write them**

Monitors:

- Command injection (GitHub Actions, child_process, os.system)
- XSS vulnerabilities (innerHTML, dangerouslySetInnerHTML)
- Code injection (eval, new Function, pickle)

### 3. explanatory-output-style 📚

**Adds educational insights about implementation choices**

Format:

```
`★ Insight ─────────────────────────────────────`
[Key educational points about the code]
`─────────────────────────────────────────────────`
```

### 4. pr-review-toolkit 🔍

**6 specialized agents for comprehensive code review**

| Agent                 | Focus            | Model   | Trigger                |
| --------------------- | ---------------- | ------- | ---------------------- |
| comment-analyzer      | Comment accuracy | inherit | "Check comments"       |
| pr-test-analyzer      | Test coverage    | inherit | "Check tests"          |
| silent-failure-hunter | Error handling   | inherit | "Check error handling" |
| type-design-analyzer  | Type design      | inherit | "Review types"         |
| code-reviewer         | General quality  | opus    | "Review code"          |
| code-simplifier       | Simplification   | opus    | "Simplify code"        |

### 5. frontend-design 🎨

**Distinctive UI/UX design for frontend work**

Auto-activates for:

- Component creation
- Page layouts
- UI development

Focuses on:

- Bold, distinctive aesthetics
- No generic AI designs
- Production-ready code

---

## Recommended Workflows

### Daily Commits

```bash
# Make changes
/commit
```

### Creating a PR

```bash
# 1. Review your code
/pr-review-toolkit:review-pr

# 2. Fix any issues

# 3. Create PR
/commit-push-pr
```

### After Merging

```bash
/clean_gone
```

### Architecture Changes

```
1. "Review hexagonal architecture compliance"  → code-reviewer
2. Make changes
3. "Check for architecture violations"         → arch-guardian (project agent)
```

### Adding Tests

```
1. Write tests
2. "Check test coverage quality"               → pr-test-analyzer
3. "Review test completeness"                  → test-analyst (project agent)
```

### Frontend Work

```
1. "Create a workout editor component"         → frontend-design (auto)
2. Implement
3. "Simplify this React component"            → code-simplifier
```

---

## Security Patterns Monitored

| Pattern                   | File Types                | Safe Alternative                    |
| ------------------------- | ------------------------- | ----------------------------------- |
| GitHub Actions injection  | `.github/workflows/*.yml` | Use `env:` variables                |
| `child_process.exec()`    | `*.ts`, `*.js`            | Use `execFile` or `execFileNoThrow` |
| `eval()`                  | `*.ts`, `*.js`            | Use `JSON.parse()`                  |
| `new Function()`          | `*.ts`, `*.js`            | Avoid dynamic code                  |
| `dangerouslySetInnerHTML` | `*.tsx`, `*.jsx`          | Sanitize with DOMPurify             |
| `document.write()`        | `*.ts`, `*.js`            | Use DOM methods                     |
| `.innerHTML =`            | `*.ts`, `*.js`            | Use `textContent` or sanitize       |
| `pickle`                  | `*.py`                    | Use JSON                            |
| `os.system()`             | `*.py`                    | Use `subprocess`                    |

---

## PR Review Agent Scores

### comment-analyzer

**Confidence:** high/medium/low

- High: Clear inaccuracies
- Medium: Vague or incomplete
- Low: Style preferences

### pr-test-analyzer

**Severity:** 1-10

- 10: Critical (MUST add tests)
- 7-9: High (Should add)
- 4-6: Medium (Consider)
- 1-3: Low (Nice to have)

### silent-failure-hunter

**Severity:** Critical/High/Medium/Low

- Critical: Data loss, security, financial
- High: User-facing, state corruption
- Medium: Internal operations
- Low: Best practices

### type-design-analyzer

**Ratings:** Each 1-10, Overall X/40

- Encapsulation
- Invariant Expression
- Usefulness
- Invariant Enforcement

### code-reviewer

**Severity:** 0-100

- 91-100: Critical (security, crashes)
- 71-90: High (bugs, performance)
- 41-70: Medium (code smells)
- 1-40: Low (style, minor improvements)

### code-simplifier

**Complexity:** High/Medium/Low

- Focuses on clarity, not brevity
- Preserves all functionality
- Reduces nesting and duplication

---

## Integration with Kaiord

### Project Agents (Existing)

- arch-guardian - Architecture validation
- cicd-guardian - CI/CD checks
- code-reviewer - Code quality
- docs-expert - Documentation
- spa-expert - React/Tailwind
- test-analyst - Test execution
- orchestrator - Review-execution cycles

### Plugins (New)

- commit-commands - Git workflow
- security-guidance - Security checks
- explanatory-output-style - Learning
- pr-review-toolkit - Code review
- frontend-design - UI/UX design

### How They Work Together

**Before committing:**

```
Project hooks → code-reviewer (plugin) → commit-commands
     ↓
Architecture check, file size, schema naming
```

**Before PR:**

```
pr-review-toolkit → arch-guardian → commit-push-pr
      ↓                  ↓
  Code review      Architecture
```

**Security:**

```
security-guidance (PreToolUse) → Project hooks (PreToolUse)
        ↓
  Blocks dangerous patterns before code is written
```

---

## Tips

### Use Commit Commands

- **DO**: Let Claude write commit messages via `/commit`
- **WHY**: Consistent style, follows conventions, includes attribution

### Pay Attention to Security Warnings

- **DO**: Review security warnings carefully before proceeding
- **WHY**: Catches vulnerabilities early, prevents production issues

### Use PR Review Before Creating PRs

- **DO**: Run `/pr-review-toolkit:review-pr` before `/commit-push-pr`
- **WHY**: Catches issues early, ensures quality, saves review time

### Request Specific Agents

- **DO**: "Check test coverage" instead of generic "review this"
- **WHY**: Triggers the right specialist agent, gets focused feedback

### Learn from Insights

- **DO**: Read the educational insights in responses
- **WHY**: Understand architecture decisions, improve over time

### Combine Tools

- **DO**: Use both project agents and plugins together
- **WHY**: Comprehensive coverage, multiple perspectives

---

## Environment Variables

```bash
# Disable security reminders (not recommended)
export ENABLE_SECURITY_REMINDER=0

# Enable (default)
export ENABLE_SECURITY_REMINDER=1
```

---

## File Locations

```
.claude/plugins/
├── commit-commands/          # Git workflow automation
├── security-guidance/        # Security checks
├── explanatory-output-style/ # Educational insights
├── pr-review-toolkit/        # Code review agents
└── frontend-design/          # UI/UX design
```

**Documentation:**

- Full guide: `docs/PLUGINS.md`
- Quick reference: `docs/PLUGINS-QUICK-REFERENCE.md`

---

## Getting Help

### Plugin Issues

```
"How do I use /commit?"
"Why is security-guidance blocking my edit?"
"Which agent should I use for test review?"
```

### Command Issues

```bash
# List all commands
/help

# Check installed plugins
ls .claude/plugins/
```

### GitHub CLI Setup

```bash
# Install
brew install gh

# Authenticate
gh auth login

# Test
gh pr list
```

---

## Next Steps

1. ✅ Plugins are installed and configured
2. ✅ Documentation is complete
3. 🚀 **Start using them!**

Try now:

```bash
# Make a small change to any file
echo "// test" >> README.md

# Use commit command
/commit

# See it in action!
```

---

**For detailed information, see [`docs/PLUGINS.md`](./PLUGINS.md)**
