> Synced: YYYY-MM-DD

# <Capability Title>

## Purpose

One to three sentences describing what this capability does and why it exists.
The sentence is read by `npx openspec validate` and by contributors scanning
the directory — make it actionable, not ceremonial.

## Requirements

### Requirement: <Short requirement name>

One paragraph stating the requirement using SHALL / MUST / SHOULD / MAY.

A requirement body MAY include Markdown tables when the constraint is a
structured enumeration (e.g., package-to-allowed-dependency mappings).

#### Scenario: <Short scenario name>

- **WHEN** <trigger>
- **THEN** <observable outcome>

<!--
Template version: 1

Authoring rules:

1. `> Synced: YYYY-MM-DD` is the first non-empty line. Update whenever the
   spec is re-verified against code. An optional parenthetical change-slug
   annotation references the archived change that last touched the spec,
   e.g. `> Synced: 2026-04-17 (settings-train2go-bridge)`. The slug MUST
   resolve to a folder under `openspec/changes/` or
   `openspec/changes/archive/` — free-form descriptions are rejected by
   the lint.
2. Exactly one `# Title` (H1), one `## Purpose`, and one `## Requirements`.
   `## Purpose` MUST appear before `## Requirements`. Additional H2
   sections are allowed as long as they do not duplicate those two.
3. Every `### Requirement:` MUST have at least one nested `#### Scenario:`
   with `WHEN` and `THEN` bullets. `GIVEN` is optional — use the 3-clause
   form (`GIVEN`/`WHEN`/`THEN`) when the precondition is non-trivial, the
   2-clause form (`WHEN`/`THEN`) otherwise. Do not pool scenarios under
   a sibling `## Scenarios` H2 — the OpenSpec CLI parser will lose
   requirement ↔ scenario traceability.
4. Do not use `## ADDED Requirements`, `## MODIFIED Requirements`, or
   `## REMOVED Requirements` in this file. Those headers are reserved for
   change-delta specs under `openspec/changes/<slug>/specs/`.
5. Validate with `pnpm lint:specs` before committing. The lint also runs
   in CI as part of `pnpm lint`.
6. **Deferred-task marker (for change `tasks.md`, NOT this template):**
   when a task is deferred to a follow-up GitHub issue, annotate the
   checkbox with a sibling Markdown blockquote (blank line + 2-space
   indent — required so prettier does not collapse the marker onto
   the task line):

   ```text
   - [ ] §N.M Task title

     > Deferred to: #ISSUE_NUMBER
   ```

   `ISSUE_NUMBER` MUST be a positive integer prefixed with `#` (zero
   is rejected). URLs, free-form descriptions, and multi-issue
   references on one line are rejected. A task deferred to multiple
   issues emits one marker line per issue. The marker is enforced by
   `scripts/check-archive-followups.mjs` (run via
   `pnpm lint:archive-followups`) once the change archives; archives
   carrying ≥ ABSOLUTE_DEFERRAL_CAP markers fail the lint as overscoped.
7. **Tasks marker (for change `tasks.md`, NOT this template):** when
   a change archives, the author SHOULD add a top-level `> Tasks:`
   marker that exposes shipped/deferred counts as machine-readable
   data. This unlocks the **ratio invariant**: `deferred ≤ completed`
   per archive — semantically correct overscope detection that
   replaces the absolute cap on archives carrying the marker.

   ```text
   > Tasks: 28 completed, 5 deferred

   <!-- opsx-ship: chunking ... -->

   ## 1. ...
   ```

   Both counts are non-negative integers; the declared `deferred`
   MUST equal the count of `> Deferred to: #N` markers in the same
   file (audited by `pnpm lint:archive-followups`). Tasks.md files
   without the marker fall back to the legacy absolute-cap policy
   (see rule 6) for backward compat with pre-v2 archives.
-->
