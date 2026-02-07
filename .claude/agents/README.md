# Claude Code Agents

This directory contains specialized AI agents for the Kaiord project. Agents are different from skills - they are autonomous workflows that orchestrate multiple skills and tools to accomplish complex tasks.

## Available Agents

### NPM Optimizer Agent

**File:** `npm-optimizer.md`
**Purpose:** Comprehensive npm package optimization

**What it does:**

- Analyzes dependencies (unused, duplicates, security)
- Checks bundle sizes against thresholds
- Identifies import optimization opportunities
- Generates prioritized action plans
- Provides implementation commands

**When to use:**

- Before creating PRs
- After adding new dependencies
- Weekly maintenance reviews
- When bundle sizes seem large
- When you want a complete health check

**How to invoke:**
Agents are invoked using the Task tool with the agent's context. Claude Code will automatically detect and use the agent definition.

Example prompt:

```
I need a comprehensive npm optimization review of all packages.
Use the NPM Optimizer Agent.
```

**Capabilities:**

- Orchestrates `/check-deps`, `/analyze-bundle`, `/optimize-imports` skills
- Cross-package analysis
- Security auditing
- Architecture validation
- Prioritized issue reporting

**Output:**
Generates a comprehensive markdown report with:

- Executive summary with health score (0-10)
- Per-package detailed findings
- Cross-package patterns and duplicates
- Prioritized action plan (Critical/High/Medium/Low)
- Ready-to-run bash commands

---

## Creating New Agents

### Agent Structure

Agents are markdown files with:

1. **Clear role definition** - What the agent specializes in
2. **Capabilities** - What skills/tools it can use
3. **Workflow** - Step-by-step execution plan
4. **Quality standards** - What standards it must follow
5. **Communication style** - How it presents information
6. **Success criteria** - How to measure success

### Best Practices

**DO:**

- ✅ Define clear scope and responsibilities
- ✅ List all available skills/tools
- ✅ Provide structured workflow (phases)
- ✅ Include example interactions
- ✅ Specify output format
- ✅ Follow project quality standards

**DON'T:**

- ❌ Make agents too general (be specific)
- ❌ Forget to integrate with existing skills
- ❌ Skip quality standards enforcement
- ❌ Provide vague instructions
- ❌ Ignore cross-package concerns

### Example Agent Template

```markdown
# [Agent Name] Agent

You are the [Agent Name] Agent for the Kaiord project. Your mission is [clear mission statement].

## Role & Capabilities

**Specialization:** [What you specialize in]

**Available Skills:**

- [List of skills this agent can use]

## Primary Responsibilities

[3-5 clear responsibilities]

## Execution Workflow

### Phase 1: [Name]

[Step-by-step instructions]

### Phase 2: [Name]

[Step-by-step instructions]

## Quality Standards

[Project quality standards this agent must follow]

## Report Format

[Expected output structure]

## Example Interactions

[Show how users interact with this agent]

## Communication Style

[How the agent communicates]

## Success Criteria

[How to measure if agent succeeded]
```

---

## Integration with Development Workflow

Agents integrate with the project's quality standards:

### Zero Tolerance Policy

All agents MUST:

- Report ALL warnings and errors
- Fix pre-existing issues
- Follow Boy Scout Rule
- Provide actionable solutions

### Before PR Checklist

Relevant agents:

- NPM Optimizer (check dependencies and bundles)
- [Future: Test Coverage Agent]
- [Future: Architecture Compliance Agent]

### Weekly Maintenance

Relevant agents:

- NPM Optimizer (comprehensive review)
- [Future: Security Audit Agent]
- [Future: Dependency Update Agent]

---

## Future Agents (Planned)

### Test Coverage Agent

- Analyze test coverage across packages
- Identify untested code paths
- Suggest test scenarios
- Generate test stubs

### Architecture Guardian Agent

- Validate hexagonal architecture
- Detect boundary violations
- Suggest refactoring opportunities
- Ensure separation of concerns

### Security Audit Agent

- Deep security scanning
- Dependency vulnerability analysis
- Code pattern security checks
- Supply chain risk assessment

### Performance Optimizer Agent

- Bundle size deep dive
- Code splitting suggestions
- Lazy loading opportunities
- Tree-shaking optimization

### Documentation Generator Agent

- API documentation
- README updates
- Changelog generation
- Example code creation

---

## Contributing

When adding new agents:

1. **Define clear scope** - What problem does it solve?
2. **List dependencies** - What skills/tools does it need?
3. **Document workflow** - How does it accomplish its goal?
4. **Provide examples** - Show typical interactions
5. **Test thoroughly** - Ensure it works as expected
6. **Update this README** - Add to the list above

---

## Notes

- Agents are autonomous workflows, not simple commands
- Agents orchestrate multiple skills for complex tasks
- Agents follow project quality standards (CLAUDE.md)
- Agents should be specialized, not general-purpose
- Good agents save hours of manual work

For questions about agents, see:

- `CLAUDE.md` - Project conventions
- `.claude/skills/README.md` - Skills documentation
- `AGENTS.md` - AI guidance
