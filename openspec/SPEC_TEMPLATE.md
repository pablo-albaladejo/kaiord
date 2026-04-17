> Synced: YYYY-MM-DD

# <Capability Title>

## Purpose

One to three sentences describing what this capability does and why it exists.
The sentence is read by `npx openspec validate` and by contributors scanning
the directory — make it actionable, not ceremonial.

## Requirements

### Requirement: <Short requirement name>

One paragraph stating the requirement using SHALL / MUST / SHOULD / MAY.

#### Scenario: <Short scenario name>

- **WHEN** <trigger>
- **THEN** <observable outcome>

<!--
Authoring rules:

1. `> Synced: YYYY-MM-DD` is the first non-empty line. Update whenever the
   spec is re-verified against code. Optionally add a short parenthetical
   annotation referencing the change that last touched the spec, e.g.
   `> Synced: 2026-04-17 (settings-train2go-bridge)`.
2. Exactly one `# Title` (H1) and exactly one `## Purpose` and one
   `## Requirements` section. Additional H2 sections are allowed but
   Purpose and Requirements are mandatory — the OpenSpec CLI refuses to
   parse specs missing either.
3. Scenarios MUST be nested under their Requirement (`#### Scenario:` under
   `### Requirement:`). Do not pool scenarios under a sibling `## Scenarios`
   section — the parser loses requirement ↔ scenario traceability.
4. Do not use `## ADDED Requirements`, `## MODIFIED Requirements`, or
   `## REMOVED Requirements` in this file. Those headers are reserved for
   change-delta specs under `openspec/changes/<slug>/specs/`.
5. Validate with `node scripts/check-spec-format.mjs` before committing.
-->
