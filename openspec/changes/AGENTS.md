<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# changes

## Purpose

Proposals: every non-trivial feature or fix lives here as a directory of
markdown files (`proposal.md`, `design.md`, `tasks.md`, optional
`delta-specs/`). Active proposals sit at the top level. Completed
proposals migrate into `archive/` at merge time and are never modified
again.

## Subdirectories

| Directory  | Purpose                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `archive/` | Read-only history of completed proposals, named `YYYY-MM-DD-<slug>`. Index in `archive/README.md`. |

Active proposals (if any) appear at this level as
`<slug>/proposal.md` etc. As of 2026-05-14 there are no active proposals;
55 archived entries.

## For AI Agents

### Working In This Directory

- **New work**: run `/opsx:propose` (it scaffolds `proposal.md`/
  `design.md`/`tasks.md`). Don't hand-edit the slug directory layout.
- **Implementation**: follow `tasks.md` in hexagonal order; tick `[x]` as
  you go. If reality diverges from the spec, update the spec first.
- **Archiving**: `/opsx:archive` moves the slug into `archive/YYYY-MM-DD-<slug>/`.
  The date MUST equal the `> Completed:` marker in `proposal.md`. Run
  `pnpm archive:index` to refresh `archive/README.md`. Verify with
  `pnpm lint:archive && pnpm lint:archive-index`.
- **Deferrals**: mark deferred tasks with `> Deferred to: #N` blockquotes
  (note: blank line + 2-space indent so Prettier preserves them). Add a
  top-level `> Tasks: <C> completed, <D> deferred` marker before archiving;
  `D ≤ C` (ratio invariant).
- **Never modify archives**: archived `tasks.md` checkboxes stay as they
  were at archive time. Fix forward in a new proposal.

### Testing Requirements

- `pnpm lint:archive` — `check-archive-dates.mjs` (date prefix ⇄ `> Completed:`)
- `pnpm lint:archive-index` — `check-archive-index.mjs` (index ⇄ filesystem)
- `pnpm lint:archive-followups` — `check-archive-followups.mjs` (deferral markers and ratio)

### Common Patterns

- One slug = one proposal = one PR (ideally). Splitting is encouraged
  before archiving if the deferred count would exceed the completed count.

## Dependencies

### Internal

References specs in `../specs/` (canonical), prior archived entries, and
`packages/*` source.

<!-- MANUAL: -->
