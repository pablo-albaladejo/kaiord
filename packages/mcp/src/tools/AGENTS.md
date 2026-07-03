<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/tools/`

## Purpose

All MCP **tool** registrations plus their internal pipeline helpers
(`convert-to-krd`, `convert-from-krd`, `diff-compare`,
`build-inspect-summary`). Each `kaiord-*.ts` file exports a
`register<Name>Tool(server, logger?)` function consumed by
`../server/create-server.ts`.

## Key Files (one entry per MCP tool)

- `kaiord-get-format-spec.ts` — MCP tool **`kaiord_get_format_spec`**. No
  args. Returns the bundled KRD specification markdown (loaded via
  `findSpecFile`). The server `instructions` ask LLMs to call this before
  authoring KRD.
- `kaiord-list-formats.ts` — MCP tool **`kaiord_list_formats`**. No args.
  Returns `FORMAT_REGISTRY` projected to `{format, name, extension,
description, binary}` as JSON.
- `kaiord-convert.ts` — MCP tool **`kaiord_convert`**. Args
  `{input_file?, input_content?, input_format?, output_format,
output_file?}`. Validates mutual exclusivity, converts via
  `convertToKrd` → `convertFromKrd`, returns text body and (if applicable)
  the written-to path. `output_file` is required for binary `fit` output.
- `kaiord-validate.ts` — MCP tool **`kaiord_validate`**. Args `{input_file?,
input_content?}`. Parses text as JSON and runs `validateKrd` from
  `@kaiord/core`. On success returns `"Valid KRD document."`.
- `kaiord-round-trip-validate.ts` — MCP tool
  **`kaiord_round_trip_validate`**. Args `{input_file}` (FIT only). Runs
  `validateRoundTrip` (FIT → KRD → FIT) with `createToleranceChecker`,
  formats any `ToleranceViolation[]` as `"<field>: expected X, got Y
(deviation: D, tolerance: T)"`.
- `kaiord-inspect.ts` — MCP tool **`kaiord_inspect`**. Args `{input_file,
input_format?}`. Converts to KRD, then returns a human-readable summary
  (type, sport, sub-sport, metadata, session/lap/record/event counts, and
  structured-workout name + step count) from `buildInspectSummary`.
- `kaiord-extract-workout.ts` — MCP tool **`kaiord_extract_workout`**. Args
  `{input_file?, input_content?, input_format?}`. Calls
  `extractWorkout(krd)` from `@kaiord/core` and returns it as pretty JSON.
- `kaiord-diff.ts` — MCP tool **`kaiord_diff`**. Args `{file1, file2,
format1?, format2?}`. Loads both into KRD in parallel, runs
  `compareKrdFiles` and returns a `{metadata, steps, extensions}` diff as
  JSON.
- `kaiord-garmin-login.ts` — MCP tool **`kaiord_garmin_login`**. Args
  `{email, password}`. Authenticates the shared `GarminConnectClient`
  singleton.
- `kaiord-garmin-logout.ts` — MCP tool **`kaiord_garmin_logout`**. No args.
  Calls `auth.logout()` and resets the singleton.
- `kaiord-garmin-list.ts` — MCP tool **`kaiord_garmin_list`**. Args
  `{limit?, offset?}`. Lists workouts from Garmin Connect after checking
  `is_authenticated()`.
- `kaiord-garmin-push.ts` — MCP tool **`kaiord_garmin_push`**. Args
  `{input_file?, input_content?}`. Parses + validates KRD, then pushes via
  the Garmin Connect service; returns the API response JSON.

## Internal pipeline helpers (not directly registered as tools)

- `convert-to-krd.ts` — `convertToKrd(file?, content?, format?, logger):
Promise<KRD>`. Resolves the format (explicit arg → path extension), then
  branches to `readBinaryInput` (FIT path or base64 inline) or
  `readTextInput`, instantiating the right reader from `FORMAT_REGISTRY`.
- `convert-from-krd.ts` — `convertFromKrd(krd, outputFormat, outputFile?,
logger): Promise<{content, writtenTo}>`. Branches binary vs text writer;
  binary output requires `outputFile`; text output is also written to disk
  when `outputFile` is provided.
- `build-inspect-summary.ts` — `buildInspectSummary(krd): string`. Joins
  metadata, data counts (sessions/laps/records/events), and structured
  workout info into the human-readable string returned by `kaiord_inspect`.
- `diff-compare.ts` — `compareKrdFiles(krd1, krd2): DiffResult`. Compares
  the fixed `METADATA_FIELDS` list, walks workout `steps` index by index,
  and computes added/removed/changed extension keys.

## Subdirectories

(none)

## For AI Agents

### Working In This Directory

- Tool naming: snake*case prefixed with `kaiord*`; file name mirrors the
  tool name (`kaiord-foo.ts`registers`kaiord_foo`).
- Every tool handler wraps its body in `try { ... } catch (error) { return
formatError(error); }` so MCP clients always receive a structured
  `{content, isError}` shape instead of a thrown exception.
- `input_file` / `input_content` are mutually exclusive — call
  `validateExclusiveInput` before doing any work.
- For binary input via `input_content`, the LLM is expected to send
  base64; `convertToKrd` calls `decodeBase64` which validates the
  alphabet and rejects empty results.
- Garmin tools share a single client via `getGarminClient(logger)`; always
  call `auth.is_authenticated()` before list/push, and return an
  authentication-required error otherwise.

### Testing Requirements

- Each tool has a co-located `*.test.ts`. Most use
  `tests/helpers/mcp-test-client.ts` to call the tool through the
  in-memory transport.
- `it()` titles start with `"should "`; bodies use Pascal `// Arrange` /
  `// Act` / `// Assert`.

### Common Patterns

- Three-line tool registration: build the Zod arg shape, call
  `server.tool`, return `formatSuccess`/`formatError`.
- Pipeline helpers (`convert-to-krd`, `convert-from-krd`, `diff-compare`,
  `build-inspect-summary`) are pure async functions so they can be unit
  tested without an `McpServer`.
- The 100-line cap forces multi-step helpers to be split (binary vs text,
  metadata vs steps vs extensions); follow the same pattern when adding new
  tools.

## Dependencies

### Internal

- `@kaiord/core` — `KRD`, `Logger`, `extractWorkout`, `validateKrd`,
  `validateRoundTrip`, `createToleranceChecker`, `fromBinary`, `fromText`,
  `toBinary`, `toText`, `ToleranceViolation`.
- `@kaiord/fit` (lazy via `FORMAT_REGISTRY`) — `createFitReader`,
  `createFitWriter` (also used eagerly by round-trip validate).
- `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` (lazy) — readers/writers.
- `@kaiord/garmin-connect` — used through `getGarminClient` helper.
- `../types/tool-schemas` — `formatSchema`, `isBinaryFormat`.
- `../utils/*` — `error-formatter`, `resolve-input`, `file-io`,
  `format-registry`, `base64`, `garmin-client-state`, `find-spec-file`.

### External

- `@modelcontextprotocol/sdk/server/mcp.js` — `McpServer`.
- `zod` — input shape schemas.

<!-- MANUAL: -->
