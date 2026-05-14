<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/schemas

Zod schema validators for Garmin API responses and token structures. All schemas use camelCase (adapter convention).

**Files:**

- `garmin-token.schema.ts` — Validators for OAuth1 and OAuth2 token objects
- `workout-response.schema.ts` — Validators for Garmin API workout list and push responses

**Key patterns:**

- All schemas defined with Zod; use `.parse()` and `.safeParse()` for validation
- Schemas extract typed data from raw JSON responses before use
- Validation failures throw ZodError; caught and wrapped in ServiceApiError
- Token schema validates structure and required fields (oauth1, oauth2)
- Workout schema validates GCN workout summary and push result structure

**Testing:**

- Test valid payloads pass validation
- Test invalid/missing fields fail with meaningful errors
- Test schema refinement (e.g., expires_at timestamp validation)

<!-- MANUAL: -->
