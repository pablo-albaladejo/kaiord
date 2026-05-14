<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# legal

## Purpose

Legal documentation for Kaiord and its associated browser extensions (train2go-bridge, garmin-bridge). Currently houses the privacy policy. Hand-written content; linted by `scripts/check-privacy-policy.mjs`.

## Key Files

- `privacy-policy.md` — Privacy policy: data collection, use, retention, compliance, extension disclosures

## Subdirectories

None. All legal content is in this directory.

## For AI Agents

### Working In This Directory

Edit `privacy-policy.md` hand-written directly. **IMPORTANT**: All changes are linted by `scripts/check-privacy-policy.mjs`.

**Conventions:**

1. Frontmatter: `title` and `description` for SEO.
2. Structure: Follow standard privacy policy structure (data collection, use, retention, contact).
3. Extension disclosures: Privacy policy must disclose data flows for train2go-bridge and garmin-bridge extensions.
4. Spec compliance: Policy must match the privacy spec at `openspec/specs/privacy-policy/spec.md`.
5. Manifest sync: Policy must align with `externally_connectable` and `permissions` in each extension's `manifest.json`.

### Testing Requirements

- **Privacy policy lint**: `pnpm --filter @kaiord/docs test` runs `check-privacy-policy.test.mjs`, which validates:
  - Policy exists and is readable
  - Policy contains all required disclosure bullets from `openspec/specs/privacy-policy/spec.md`
  - Policy lists all hosts that extensions may contact (from manifest.json `externally_connectable`)
  - Policy matches actual extension `permissions` in both manifests
- **Spelling**: `pnpm --filter @kaiord/docs spellcheck` validates `privacy-policy.md`.
- **Formatting**: `pnpm --filter @kaiord/docs lint:fix` auto-formats.
- **Build validation**: `pnpm --filter @kaiord/docs build` ensures the page renders.

### Common Patterns

- **Required disclosures**: The spec in `openspec/specs/privacy-policy/spec.md` defines mandatory disclosure bullets. All must appear in the policy.
- **Host allowlisting**: The lint guard maintains a set of allowed hosts for each extension. If an extension gains new `externally_connectable` entries, update the policy.
- **Localhost dev URLs**: The policy explicitly discloses development server URLs (http://localhost:5173, http://localhost:5174) that extensions connect to during development.
- **GDPR/CCPA compliance**: Policy covers data subject rights, retention limits, and third-party disclosures.

## Dependencies

### Internal

- `openspec/specs/privacy-policy/spec.md` — Spec defining required disclosures
- `packages/train2go-bridge/manifest.json` — Extension permissions and externally_connectable
- `packages/garmin-bridge/manifest.json` — Extension permissions and externally_connectable
- `scripts/check-privacy-policy.mjs` — Lint guard (enforces spec compliance)
- `scripts/check-privacy-policy.test.mjs` — Test suite for lint guard

### External

- **VitePress** — Renders Markdown to HTML

<!-- MANUAL: -->

## Notes for Agents

1. **Privacy policy is linted, not hand-checked**: The lint guard `scripts/check-privacy-policy.mjs` automatically verifies compliance. Run tests before committing.
2. **Spec-driven**: The privacy spec at `openspec/specs/privacy-policy/spec.md` defines what must be disclosed. All required bullets must appear verbatim in the policy.
3. **Extension manifests are sources of truth**: The hosts listed in each extension's `manifest.json` `externally_connectable` must be listed in the policy.
4. **Changing extensions requires policy updates**: If train2go-bridge or garmin-bridge gains new hosts or permissions, update the policy immediately or CI will fail.
5. **Legal review recommended**: This policy covers data handling for user data (workouts, profiles). Consider legal review before major changes.
6. **Localhost is disclosed**: The policy explicitly mentions development servers on localhost:5173 and localhost:5174, allowing developers to test extensions locally.
