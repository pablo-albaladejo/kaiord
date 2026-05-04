# AGENTS.md — Kaiord

> Guidance for AI/code agents (GPT, Claude, etc.). Short, strict, and actionable.

## Non‑negotiables

- **Hexagonal architecture** (domain/application/ports/adapters/cli)
- **Dependency injection** (no external libs in inner layers)
- **KRD** as canonical format; MIME `application/vnd.kaiord+json`
- **Round‑trip safety** with Zod validation (JSON Schema via AJV for external consumers)
- **Typed API**: no implicit `any`
- **Never relax rules**: If code violates a lint rule, coverage threshold, or quality standard — fix the code, never downgrade the rule. This applies to ALL code, including pre-existing violations not introduced by the current change. Use `pnpm lint:fix` for auto-fixable issues, manual refactoring for the rest.

## Spec Awareness

Before implementing any non-trivial feature or fix:

1. **Check for active spec**: Look in `openspec/changes/` for a matching proposal
2. **Read the spec**: If found, read `proposal.md`, `design.md`, and `tasks.md` before writing code
3. **Read domain specs**: Reference `openspec/specs/` for architecture and format constraints
4. **Implement in spec order**: Follow the hexagonal ordering in `tasks.md`
5. **Update task checkboxes**: Mark `tasks.md` items `[x]` as work progresses
6. **Do not diverge silently**: If the spec is wrong or incomplete, flag it — do not silently implement differently

If no spec exists for a requested non-trivial change, create one with `/opsx:propose` before coding.

Domain specs under `openspec/specs/` follow the canonical shape in
`openspec/SPEC_TEMPLATE.md`. When you add or edit one, run `pnpm lint:specs`
locally — CI enforces the same check as part of `pnpm lint`.

Archives under `openspec/changes/archive/` MUST be named `YYYY-MM-DD-<slug>`
where `YYYY-MM-DD` equals the `> Completed:` marker inside the archived
`proposal.md`. The invariant is enforced by `pnpm lint:archive`. After
archiving, run `pnpm archive:index` to refresh
`openspec/changes/archive/README.md`.

When a task is deferred to a follow-up GitHub issue, annotate the
checkbox in `tasks.md` with a single canonical Markdown blockquote
as a sibling paragraph (blank line + 2-space indent — required so
prettier does not collapse the marker onto the task line):

```text
- [ ] §N.M Task title

  > Deferred to: #ISSUE_NUMBER
```

`ISSUE_NUMBER` MUST be a positive integer prefixed with `#` (zero is
rejected). URLs and free-form descriptions are rejected. The invariant
is enforced by `pnpm lint:archive-followups` once the change archives —
archives carrying too many deferrals fail the lint as overscoped (the
change should have been split before archiving).

When archiving, also add a top-level `> Tasks: <C> completed, <D> deferred`
marker at the very top of `tasks.md`. This unlocks the **ratio invariant**
(`deferred ≤ completed` per archive — semantically correct overscope
detection) instead of the legacy absolute cap. The declared `deferred`
MUST match the count of `> Deferred to: #N` markers in the file; mismatch
fails the lint. Archives without the marker fall back to the legacy cap
for backward compat.

```text
> Tasks: 28 completed, 5 deferred

<!-- opsx-ship: chunking ... -->

## 1. ...
```

## Ports & adapters (example: FIT)

- **Ports** (`ports/fit.ts`): `FitReader.readToKRD(buf)`, `FitWriter.writeFromKRD(krd)`
- **Adapters** (`adapters/fit/garmin-fitsdk.ts`): map to/from KRD using `@garmin/fitsdk`
- **Binding** (`application/providers.ts`): single place to switch providers

## Public API surface

```ts
// Strategy pattern: inject reader/writer directly
fromBinary(buffer: Uint8Array, reader: BinaryReader, logger?: Logger): Promise<KRD>
fromText(text: string, reader: TextReader, logger?: Logger): Promise<KRD>
toBinary(krd: KRD, writer: BinaryWriter, logger?: Logger): Promise<Uint8Array>
toText(krd: KRD, writer: TextWriter, logger?: Logger): Promise<string>
```

## Code style

- Files ≤ 100 lines; functions < 40 LOC (tests exempt)
- Domain schemas: **snake_case** (`indoor_cycling`, `lap_swimming`)
- Adapter schemas: **camelCase** (`indoorCycling`, `lapSwimming`)
- Use `type` not `interface`; separate type imports (`import type { X }`)
- Mappers (`*.mapper.ts`) = simple transformation, no logic, no tests
- Converters (`*.converter.ts`) = complex logic, requires tests
- Access enum values via `.enum`: `subSportSchema.enum.indoor_cycling`

## Testing

- Unit for pure functions/validators
- Round‑trip (FIT/TCX/ZWO ↔ KRD) with tolerances: time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm
- CLI smoke: `kaiord convert --in sample.krd --out out.tcx`
- Test utilities: `@kaiord/core/test-utils` exports fixture loaders

### Test conventions (mechanically enforced)

Two structural invariants on every `*.test.{ts,tsx}` file under `packages/**`:

1. **Title rule** (`R-ItTitleShould`) — every `it()`/`it.skip()`/`it.only()`/`it.each([...])(...)` title MUST start with the literal `should ` (case-sensitive lowercase). Aliases via AST shape (any `it[.<alias>]`); vitest substitution placeholders (`%s`, `%d`, `$prop`) stripped before the prefix check.
2. **AAA rule** (`R-ItBodyAAA`) — every `it()` body MUST contain canonical Pascal-case line comments `// Arrange`, `// Act`, `// Assert` (in that order, separated by blank lines). Multiple statements per section; empty sections allowed (the marker is required, the body can be empty).

```ts
// Good
it("should reject malformed input", () => {
  // Arrange
  const input = "bad";

  // Act
  const result = parse(input);

  // Assert
  expect(result.error).toBe("malformed");
});
```

Out-of-scope files: `**/*.stories.{ts,tsx}` (Storybook), `**/test-utils/**`, `**/test-setup.ts`, `e2e/**` (Playwright).

Enforced at three layers:

- **IDE**: ESLint `vitest/valid-title` rule at `'error'` (yellow squiggle).
- **pre-commit**: `pnpm test:scripts` runs `scripts/check-test-{title-should,aaa}.mjs` on staged files via `--changed-files`.
- **CI**: same scripts in full-tree mode.

See `openspec/specs/test-conventions/spec.md` for the canonical contract.

## Commands

```bash
pnpm -r build && pnpm -r test && pnpm lint:fix  # Before commit
pnpm exec changeset                              # For version-worthy changes
```

## Contribution flow

0. Check `openspec/changes/` for an active spec — if none, run `/opsx:propose`
1. Implement domain/application/ports → adapters (hexagonal order, guided by `tasks.md`)
2. Add tests (unit + round‑trip, verify against spec scenarios)
3. Run: `pnpm -r build && pnpm -r test && pnpm lint:fix`
4. Add changeset if version-worthy: `pnpm exec changeset`
5. Update docs if public API changes
6. After merge: `/opsx:archive` to preserve decisions

## Runbooks

- [`docs/runbooks/cws-service-account.md`](docs/runbooks/cws-service-account.md) — Chrome Web Store service-account setup, key rotation, emergency `force_upload` re-publish, compromised-key response. Required reading before touching `.github/workflows/cws-publish.yml`.
