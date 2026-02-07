# Claude Code Plugins for Kaiord

This document describes the official Claude Code plugins installed in this project and how to use them effectively.

## Overview

We've installed 5 official plugins from the Anthropic Claude Code repository to enhance our development workflow:

### ✅ Highly Recommended (Installed)

1. **commit-commands** - Git workflow automation
2. **security-guidance** - Security vulnerability detection
3. **explanatory-output-style** - Educational insights

### ⚠️ Conditionally Useful (Installed)

4. **pr-review-toolkit** - Comprehensive PR review with 6 specialized agents
5. **frontend-design** - Distinctive UI/UX design guidance

---

## 1. Commit Commands

**Location**: `.claude/plugins/commit-commands/`

### What It Does

Streamlines git operations with automated commit message generation, push workflows, and branch cleanup.

### Commands

#### `/commit`

Creates a git commit with an automatically generated commit message.

**Process:**

1. Analyzes git status
2. Reviews staged and unstaged changes
3. Examines recent commits to match repository style
4. Creates commit with appropriate message
5. Includes Claude Code attribution

**Usage:**

```bash
# After making changes
/commit
```

**Features:**

- Follows conventional commits (feat/fix/chore/docs)
- Matches Kaiord's commit style
- Avoids committing secrets (.env files)
- Includes `Co-Authored-By: Claude Sonnet 4.5`

#### `/commit-push-pr`

Complete workflow: commit → push → create PR (with changeset).

**Process:**

1. Creates changeset if version-worthy: `pnpm exec changeset`
2. Creates feature branch (if on main)
3. Commits changes
4. Pushes to origin
5. Creates pull request via `gh pr create`

**Usage:**

```bash
# When ready to create PR
/commit-push-pr
```

**Requirements:**

- GitHub CLI (`gh`) installed and authenticated
- Changes are version-worthy (feature/fix)

**PR includes:**

- Summary of changes (1-3 bullets)
- Test plan checklist
- Claude Code attribution

#### `/clean_gone`

Cleans up local branches deleted from remote.

**Process:**

1. Lists branches marked as [gone]
2. Removes associated worktrees
3. Deletes stale local branches

**Usage:**

```bash
# After PRs are merged
/clean_gone
```

**When to use:**

- After merging and deleting remote branches
- During regular repository maintenance

---

## 2. Security Guidance

**Location**: `.claude/plugins/security-guidance/`

### What It Does

PreToolUse hook that warns about security vulnerabilities before writing/editing files.

### Monitored Patterns

The plugin monitors 9 security vulnerability patterns:

1. **GitHub Actions Command Injection**
   - Detects: `.github/workflows/*.yml` files
   - Warns about: Using untrusted input in `run:` commands
   - Safe pattern: Use `env:` variables instead

2. **child_process.exec Injection**
   - Detects: `exec(`, `execSync(`
   - Warns about: Shell injection vulnerabilities
   - Safe pattern: Use `execFile` or project's `execFileNoThrow`

3. **new Function() Injection**
   - Detects: `new Function(`
   - Warns about: Code injection via dynamic strings

4. **eval() Usage**
   - Detects: `eval(`
   - Warns about: Arbitrary code execution
   - Safe pattern: Use `JSON.parse()` for data

5. **React dangerouslySetInnerHTML**
   - Detects: `dangerouslySetInnerHTML`
   - Warns about: XSS vulnerabilities
   - Safe pattern: Sanitize with DOMPurify

6. **document.write() XSS**
   - Detects: `document.write`
   - Warns about: XSS and performance issues
   - Safe pattern: Use DOM methods

7. **innerHTML Assignment**
   - Detects: `.innerHTML =`
   - Warns about: XSS vulnerabilities
   - Safe pattern: Use `textContent` or sanitize

8. **Python pickle Deserialization**
   - Detects: `pickle`
   - Warns about: Arbitrary code execution
   - Safe pattern: Use JSON

9. **os.system() Injection**
   - Detects: `os.system`
   - Warns about: Command injection
   - Safe pattern: Use `subprocess` with list args

### How It Works

- **Triggers**: Before `Edit`, `Write`, or `MultiEdit` operations
- **Session-scoped**: Shows warning once per file/rule per session
- **Blocking**: Stops operation until acknowledged
- **State tracking**: `~/.claude/security_warnings_state_{session_id}.json`
- **Debug logs**: `/tmp/security-warnings-log.txt`

### Disabling

To temporarily disable (not recommended):

```bash
export ENABLE_SECURITY_REMINDER=0
```

### Why This Matters for Kaiord

- Binary file parsing (FIT files use `Uint8Array`)
- External data conversion (TCX, ZWO files from untrusted sources)
- CLI input handling (file paths, format types)
- Future web editor (XSS protection needed)

---

## 3. Explanatory Output Style

**Location**: `.claude/plugins/explanatory-output-style/`

### What It Does

SessionStart hook that adds educational insights throughout Claude's responses.

### Format

Insights appear as formatted blocks:

```
`★ Insight ─────────────────────────────────────`
[2-3 key educational points about implementation choices]
`─────────────────────────────────────────────────`
```

### What You'll Learn

**Kaiord-specific insights:**

- Why hexagonal architecture for this project
- When to use mappers vs converters
- Round-trip tolerance decisions
- Schema naming conventions (snake_case vs camelCase)

**Technical insights:**

- TypeScript patterns used
- Performance trade-offs
- Testing strategies
- Design pattern rationale

### When It's Most Useful

- **Onboarding**: Understanding architecture decisions
- **Learning**: Why certain patterns are used
- **Reviewing**: Trade-offs in implementation choices
- **Debugging**: Why code is structured a certain way

### Example Insight

```
`★ Insight ─────────────────────────────────────`
This uses a mapper (*.mapper.ts) rather than a converter because:
1. Simple 1:1 field transformation with no logic
2. No tests needed (too simple to break)
3. Keeps converters focused on complex transformations
`─────────────────────────────────────────────────`
```

---

## 4. PR Review Toolkit

**Location**: `.claude/plugins/pr-review-toolkit/`

### What It Does

Comprehensive PR review using 6 specialized agents that analyze different aspects of code quality.

### Agents

#### 1. **comment-analyzer** (green)

**Focus**: Comment accuracy and documentation quality

**Analyzes:**

- Comment accuracy vs actual code
- Incomplete documentation
- Comment rot (outdated comments)
- Misleading comments

**Confidence scores**: high/medium/low

**Use when:**

- After adding documentation
- Before finalizing PRs
- When reviewing comments

**Trigger examples:**

```
"Check if the comments are accurate"
"Review the documentation I added"
"Analyze comments for technical debt"
```

#### 2. **pr-test-analyzer** (cyan)

**Focus**: Test coverage quality and completeness

**Analyzes:**

- Behavioral vs line coverage
- Critical coverage gaps
- Test quality and resilience
- Edge cases and error conditions

**Severity ratings**: 1-10 (10 = critical, must add)

**Use when:**

- After creating a PR
- When adding new functionality
- To verify test thoroughness

**Trigger examples:**

```
"Check if the tests are thorough"
"Review test coverage for this PR"
"Are there any critical test gaps?"
```

**Kaiord-specific checks:**

- Round-trip test completeness
- Tolerance validation (±1s, ±1W, ±1bpm)
- AAA pattern compliance
- Integration test coverage

#### 3. **silent-failure-hunter** (yellow)

**Focus**: Error handling and silent failures

**Analyzes:**

- Silent failures in catch blocks
- Inadequate error handling
- Inappropriate fallback behavior
- Missing error logging

**Severity**: Critical/High/Medium/Low

**Zero tolerance for:**

- Empty catch blocks
- `console.log` as error handling
- Swallowing errors with default values
- Generic error messages

**Use when:**

- After implementing error handling
- When reviewing try/catch blocks
- Before finalizing PRs

**Trigger examples:**

```
"Review the error handling"
"Check for silent failures"
"Analyze catch blocks in this PR"
```

**Kaiord-specific checks:**

- FIT binary parsing errors
- File I/O error handling
- Conversion failure reporting
- Validation error messages

#### 4. **type-design-analyzer** (pink)

**Focus**: Type design quality and invariants

**Analyzes:**

- Encapsulation (rated 1-10)
- Invariant expression (rated 1-10)
- Usefulness (rated 1-10)
- Invariant enforcement (rated 1-10)

**Overall score**: X/40

**Use when:**

- Introducing new types
- During PR creation with data models
- Refactoring type designs

**Trigger examples:**

```
"Review the UserAccount type design"
"Analyze type design in this PR"
"Check if this type has strong invariants"
```

**Kaiord-specific checks:**

- KRD schema type safety
- Branded types for domain concepts
- Zod schema completeness
- Union type exhaustiveness

#### 5. **code-reviewer** (green, opus model)

**Focus**: General code quality and CLAUDE.md compliance

**Analyzes:**

- CLAUDE.md compliance
- Style violations
- Bug detection
- Performance issues

**Severity**: 0-100 (91-100 = critical)

**Use when:**

- After writing or modifying code
- Before committing changes
- Before creating PRs

**Trigger examples:**

```
"Review my recent changes"
"Check if everything looks good"
"Review this code before I commit"
```

**Kaiord-specific checks:**

- Hexagonal architecture violations
- File size limits (≤100 lines)
- Function length (≤40 lines)
- `type` vs `interface` usage
- Schema naming (snake_case in domain, camelCase in adapters)
- Mapper vs converter usage

#### 6. **code-simplifier** (blue, opus model)

**Focus**: Code simplification and clarity

**Analyzes:**

- Unnecessary complexity and nesting
- Code duplication
- Overly clever code
- Consistency with project patterns

**Preserves**:

- Functionality (NO behavior changes)
- Error handling
- Edge cases

**Use when:**

- After code works but feels complex
- After passing code review
- When refining implementation

**Trigger examples:**

```
"Simplify this code"
"Make this clearer"
"Refine this implementation"
```

### Using the Toolkit

#### Command Usage

```bash
# Full comprehensive review
/pr-review-toolkit:review-pr

# Targeted review (specific agents)
/pr-review-toolkit:review-pr comment-analyzer pr-test-analyzer

# By concern type
/pr-review-toolkit:review-pr tests errors
```

#### Natural Language (Auto-triggers)

Just ask naturally - Claude will invoke the appropriate agent:

```
"Check test coverage for this PR"
→ Triggers pr-test-analyzer

"Review error handling in api.ts"
→ Triggers silent-failure-hunter

"Are my comments accurate?"
→ Triggers comment-analyzer

"Review type design"
→ Triggers type-design-analyzer

"Can you simplify this function?"
→ Triggers code-simplifier
```

### Recommended Workflow

**Before committing:**

```
1. Write code
2. "Review my changes" → code-reviewer
3. Fix issues
4. "Check for silent failures" → silent-failure-hunter (if error handling changed)
```

**Before creating PR:**

```
1. "Check test coverage" → pr-test-analyzer
2. "Review comments" → comment-analyzer (if added docs)
3. "Review type design" → type-design-analyzer (if added types)
4. Full review: /pr-review-toolkit:review-pr
```

**After passing review:**

```
1. "Simplify this code" → code-simplifier
2. Polish and refine
```

### Agent Models

- **opus agents** (code-reviewer, code-simplifier): Most capable, for complex analysis
- **inherit agents** (others): Use session model, faster and cheaper

### Integration with Existing Tools

Works with Kaiord's existing agents:

- **arch-guardian**: Architecture validation (still use for hexagonal checks)
- **test-analyst**: Test execution (pr-test-analyzer is for reviewing tests)
- **code-reviewer** (project agent): Complement with toolkit's code-reviewer

Use both for comprehensive coverage!

---

## 5. Frontend Design

**Location**: `.claude/plugins/frontend-design/`

### What It Does

Automatically activated skill for building distinctive, production-grade frontend interfaces.

### When It's Used

Auto-invoked when you request frontend work:

```
"Create a dashboard for workout tracking"
"Build a landing page for Kaiord"
"Design a workout editor interface"
```

### Design Philosophy

**BOLD aesthetic choices:**

- NOT generic AI aesthetics (no Inter font, no purple gradients)
- Commit to a clear aesthetic direction
- Intentional design, whether minimal or maximal

**Key focus areas:**

1. **Typography**
   - Distinctive, characterful fonts
   - Avoid: Inter, Roboto, Arial, system fonts
   - Pair display font + refined body font

2. **Color & Theme**
   - Cohesive aesthetic via CSS variables
   - Dominant colors with sharp accents
   - No timid, evenly-distributed palettes

3. **Motion**
   - High-impact animations (CSS-first)
   - Staggered reveals for page load
   - Scroll-triggered effects
   - Surprising hover states

4. **Spatial Composition**
   - Unexpected layouts
   - Asymmetry and overlap
   - Generous negative space OR controlled density

5. **Visual Details**
   - Gradient meshes, noise textures
   - Geometric patterns
   - Layered transparencies
   - Custom cursors, grain overlays

### For Kaiord SPA Editor

**Workout-specific aesthetics:**

- Athletic/performance-focused theme
- Data visualization excellence
- Clear hierarchy (workout → steps → targets)
- Mobile-first responsive design

**Technical integration:**

- React + TypeScript
- Tailwind for utility classes
- Framer Motion for animations
- Chart.js for power curves

### Example Request

```
"Design a workout step editor with:
- Power zones visualization
- Duration/distance controls
- Drag-to-reorder steps
- Real-time power curve preview

Theme: Athletic minimalism with accent colors for power zones"
```

Claude will:

1. Choose a bold aesthetic direction
2. Implement production-ready React components
3. Include animations and micro-interactions
4. Ensure responsive design
5. Provide accessible, semantic HTML

---

## Plugin Configuration

All plugins are configured in `.claude/settings.local.json` (already set up):

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "Bash",
      "mcp__playwright__*",
      "mcp__vitest__*",
      "mcp__context7__*",
      "WebSearch",
      "WebFetch",
      "Skill(test)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-architecture.js"
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-schema-naming.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-file-size.js"
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-test-needed.js"
          }
        ]
      }
    ]
  }
}
```

**Note**: security-guidance and explanatory-output-style hooks are auto-registered by their `hooks/hooks.json` files.

---

## Best Practices

### For Daily Development

1. **Use `/commit` frequently** - Let Claude handle commit messages
2. **Run security checks** - Pay attention to security warnings
3. **Review with agents** - Use pr-review-toolkit before PRs
4. **Learn from insights** - Read explanatory insights to understand decisions

### For Pull Requests

1. **Before creating PR**:

   ```bash
   /pr-review-toolkit:review-pr
   ```

2. **When ready**:

   ```bash
   /commit-push-pr
   ```

3. **After merging**:
   ```bash
   /clean_gone
   ```

### For Architecture Work

- **arch-guardian** (project agent) + **code-reviewer** (plugin) = comprehensive coverage
- Security-guidance will catch injection vulnerabilities
- Type-design-analyzer will review new domain types

### For Frontend Work

- Frontend-design auto-activates for UI work
- Spa-expert (project agent) for React-specific patterns
- Code-simplifier for refining complex components

---

## Troubleshooting

### `/commit` creates empty commit

**Issue**: No changes to commit

**Solution**: Ensure you have unstaged or staged changes

### `/commit-push-pr` fails

**Issue**: `gh pr create` fails

**Solution**:

```bash
# Install gh CLI
brew install gh

# Authenticate
gh auth login
```

### Security warnings block operation

**Issue**: Security hook blocks Edit/Write

**Solution**:

- Review the warning carefully
- Fix the security issue
- Or acknowledge and proceed if intentional

### Agent not triggering

**Issue**: Request didn't trigger expected agent

**Solution**:

- Be more specific in request
- Mention agent type explicitly
- Reference the concern directly (e.g., "test coverage")

---

## Plugin Directory Structure

```
.claude/plugins/
├── commit-commands/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── commands/
│       ├── commit.md
│       ├── commit-push-pr.md
│       └── clean_gone.md
│
├── security-guidance/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── hooks/
│       ├── hooks.json
│       └── security_reminder_hook.py
│
├── explanatory-output-style/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── hooks/
│   │   └── hooks.json
│   └── hooks-handlers/
│       └── session-start.sh
│
├── pr-review-toolkit/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── commands/
│   │   └── review-pr.md
│   └── agents/
│       ├── comment-analyzer.md
│       ├── pr-test-analyzer.md
│       ├── silent-failure-hunter.md
│       ├── type-design-analyzer.md
│       ├── code-reviewer.md
│       └── code-simplifier.md
│
└── frontend-design/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── frontend-design/
            └── SKILL.md
```

---

## Summary

### Immediate Use

- **`/commit`** - For all commits
- **`/commit-push-pr`** - When ready to create PR
- **Security warnings** - Review before proceeding
- **Educational insights** - Learn from explanations

### As Needed

- **`/pr-review-toolkit:review-pr`** - Before creating PRs
- **`/clean_gone`** - After merging branches
- **Agent requests** - Target specific review concerns
- **Frontend design** - For UI work on SPA editor

### Integration with Project

These plugins complement (not replace) Kaiord's existing custom agents:

- arch-guardian, cicd-guardian, code-reviewer
- docs-expert, spa-expert, test-analyst, orchestrator
- Custom skills: coverage, arch-review, validate-roundtrip

Together, they provide comprehensive development support aligned with Kaiord's hexagonal architecture and strict quality standards.

---

## References

- [Claude Code Plugins](https://github.com/anthropics/claude-code/tree/main/plugins)
- [Plugin Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- Kaiord CLAUDE.md - Project guidelines
- Kaiord AGENTS.md - Agent-specific guidance
