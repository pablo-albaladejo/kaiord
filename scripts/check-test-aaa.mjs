#!/usr/bin/env node
//
// Migration-state allowlist (drained to empty by PR-6). See design.md
// D5 "Two distinct allowlist patterns" for the distinction from the
// exception-allowlist pattern in scripts/check-no-pii-leakage.mjs.
//
// Rule R-ItBodyAAA.
//
// Enforces: every it()/it.<alias>(...) body in any in-scope
// *.test.{ts,tsx} file SHALL contain canonical Pascal-case line
// comments `// Arrange`, `// Act`, `// Assert` (case-sensitive,
// no trailing punctuation), one per `it()` call.
//
// Implementation: count-based heuristic — file is a violator if
// (#it-calls > #canonical-Arrange-markers) OR
// (#it-calls > #canonical-Act-markers) OR
// (#it-calls > #canonical-Assert-markers). The bootstrap script uses
// the same heuristic to seed the allowlists. Stricter checks (per-it
// ordering, blank-line separators) are spec-bound but not enforced
// at PR-1 ship-time; the migration's subagent prompt produces ordered
// + blank-line-separated markers, and PR-6 may tighten the heuristic.
//
// Three sharded allowlists per design D4 — disjoint sub-Sets so PR-3
// (BACKEND), PR-4 (SPA_NON_COMPONENT), PR-5 (SPA_COMPONENT) ship in
// parallel without merge conflicts on this file.
//
// CLI:
//   node scripts/check-test-aaa.mjs           # full-tree
//   node scripts/check-test-aaa.mjs --changed-files
//
// `--changed-files` mode mirrors check-test-title-should.mjs.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");

// MIGRATION-STATE ALLOWLISTS — sharded per D4. Each sub-Set is
// drained independently by its corresponding migration PR
// (PR-3 → BACKEND, PR-4 → SPA_NON_COMPONENT, PR-5 → SPA_COMPONENT).
// All three SHALL be `new Set()` after PR-5.
//
// Format: repo-relative POSIX file paths (no line numbers — file-
// level allowlist per D4).
let AAA_ALLOWLIST_BACKEND = new Set([
  "packages/ai/src/adapters/reindex-steps.test.ts",
  "packages/ai/src/adapters/text-to-workout.test.ts",
  "packages/ai/src/adapters/validate-input.test.ts",
  "packages/ai/src/errors.test.ts",
  "packages/ai/src/evals/assertions.test.ts",
  "packages/ai/src/evals/reporter.test.ts",
  "packages/ai/src/prompts/load-prompt.test.ts",
  "packages/cli/src/commands/config-integration.test.ts",
  "packages/cli/src/commands/convert-integration.test.ts",
  "packages/cli/src/commands/diff-integration.test.ts",
  "packages/cli/src/commands/extract-workout-integration.test.ts",
  "packages/cli/src/commands/garmin/list.test.ts",
  "packages/cli/src/commands/garmin/login.test.ts",
  "packages/cli/src/commands/garmin/logout.test.ts",
  "packages/cli/src/commands/garmin/push.test.ts",
  "packages/cli/src/commands/inspect-integration.test.ts",
  "packages/cli/src/commands/validate-integration.test.ts",
  "packages/cli/src/commands/validate/execute-validation.test.ts",
  "packages/cli/src/tests/cli-smoke.test.ts",
  "packages/cli/src/utils/directory-handler.test.ts",
  "packages/cli/src/utils/error-suggestions.test.ts",
  "packages/cli/src/utils/file-handler.test.ts",
  "packages/cli/src/utils/format-detector.test.ts",
  "packages/cli/src/utils/format-violations.test.ts",
  "packages/cli/src/utils/fs-errors.test.ts",
  "packages/cli/src/utils/krd-converter.test.ts",
  "packages/cli/src/utils/logger-factory.test.ts",
  "packages/cli/src/utils/path-security.test.ts",
  "packages/core/src/adapters/analytics/noop-analytics.test.ts",
  "packages/core/src/adapters/logger/console-logger.test.ts",
  "packages/core/src/application/from-format.test.ts",
  "packages/core/src/application/to-format.test.ts",
  "packages/core/src/domain/converters/workout-to-krd.converter.test.ts",
  "packages/core/src/domain/type-guards.test.ts",
  "packages/core/src/domain/types/errors.test.ts",
  "packages/core/src/domain/validation/extract-workout.test.ts",
  "packages/core/src/domain/validation/schema-validator.test.ts",
  "packages/core/src/domain/validation/tolerance-checker.test.ts",
  "packages/core/src/ports/logger.test.ts",
  "packages/core/src/tests/round-trip/validate-round-trip.test.ts",
  "packages/core/src/types/profile-snapshot.test.ts",
  "packages/fit/src/adapters/duration/duration.converter.test.ts",
  "packages/fit/src/adapters/event/fit-to-krd-event.converter.test.ts",
  "packages/fit/src/adapters/event/krd-to-fit-event.converter.test.ts",
  "packages/fit/src/adapters/fit-writer-integration.test.ts",
  "packages/fit/src/adapters/garmin-fitsdk.test.ts",
  "packages/fit/src/adapters/krd-to-fit/krd-to-fit-target.converter.test.ts",
  "packages/fit/src/adapters/krd-to-fit/krd-to-fit.converter.test.ts",
  "packages/fit/src/adapters/lap/fit-to-krd-lap.converter.test.ts",
  "packages/fit/src/adapters/lap/krd-to-fit-lap.converter.test.ts",
  "packages/fit/src/adapters/messages/file-type-detection.test.ts",
  "packages/fit/src/adapters/messages/file-type-routing.test.ts",
  "packages/fit/src/adapters/messages/messages.validator.test.ts",
  "packages/fit/src/adapters/record/fit-to-krd-record.converter.test.ts",
  "packages/fit/src/adapters/record/krd-to-fit-record.converter.test.ts",
  "packages/fit/src/adapters/round-trip/round-trip-duration.test.ts",
  "packages/fit/src/adapters/round-trip/round-trip-notes.test.ts",
  "packages/fit/src/adapters/round-trip/round-trip-subsport.test.ts",
  "packages/fit/src/adapters/round-trip/round-trip-swimming.test.ts",
  "packages/fit/src/adapters/session/fit-to-krd-session.converter.test.ts",
  "packages/fit/src/adapters/session/krd-to-fit-session.converter.test.ts",
  "packages/fit/src/adapters/shared/coordinate.converter.test.ts",
  "packages/fit/src/adapters/target/target-cadence.converter.test.ts",
  "packages/fit/src/adapters/target/target-heart-rate.converter.test.ts",
  "packages/fit/src/adapters/target/target-pace.converter.test.ts",
  "packages/fit/src/adapters/target/target-power.converter.test.ts",
  "packages/fit/src/adapters/target/target-stroke.converter.test.ts",
  "packages/garmin-connect/src/adapters/auth/garmin-auth-provider.test.ts",
  "packages/garmin-connect/src/adapters/client/build-refresh-fn.test.ts",
  "packages/garmin-connect/src/adapters/client/garmin-connect-client.test.ts",
  "packages/garmin-connect/src/adapters/client/garmin-workout-service.test.ts",
  "packages/garmin-connect/src/adapters/http/garmin-auth-fetch.test.ts",
  "packages/garmin-connect/src/adapters/http/garmin-http-client.test.ts",
  "packages/garmin-connect/src/adapters/http/garmin-sso.test.ts",
  "packages/garmin-connect/src/adapters/http/oauth-consumer.test.ts",
  "packages/garmin-connect/src/adapters/http/retry.test.ts",
  "packages/garmin-connect/src/adapters/http/sso-login.test.ts",
  "packages/garmin-connect/src/adapters/http/sso-oauth.test.ts",
  "packages/garmin-connect/src/adapters/http/sso-validators.test.ts",
  "packages/garmin-connect/src/adapters/token-store/file-token-store.test.ts",
  "packages/garmin-connect/src/adapters/token/token-manager.test.ts",
  "packages/garmin-connect/src/index.integration.test.ts",
  "packages/garmin/src/adapters/converters/executable-step.converter.test.ts",
  "packages/garmin/src/adapters/converters/flatten-segments.converter.test.ts",
  "packages/garmin/src/adapters/converters/garmin-repetition.converter.test.ts",
  "packages/garmin/src/adapters/converters/garmin-to-krd.converter.test.ts",
  "packages/garmin/src/adapters/converters/garmin-workout-step.converter.test.ts",
  "packages/garmin/src/adapters/converters/krd-to-garmin.converter.test.ts",
  "packages/garmin/src/adapters/mappers/target.converter.test.ts",
  "packages/garmin/src/adapters/round-trip/round-trip.test.ts",
  "packages/landing/src/adapters/analytics/cloudflare-analytics.test.ts",
  "packages/mcp/src/adapters/stderr-logger.test.ts",
  "packages/mcp/src/bin/kaiord-mcp.build.test.ts",
  "packages/mcp/src/tools/build-inspect-summary.test.ts",
  "packages/mcp/src/tools/convert-from-krd.test.ts",
  "packages/mcp/src/tools/convert-to-krd.test.ts",
  "packages/mcp/src/tools/diff-compare.test.ts",
  "packages/mcp/src/tools/kaiord-convert.test.ts",
  "packages/mcp/src/tools/kaiord-diff.test.ts",
  "packages/mcp/src/tools/kaiord-extract-workout.test.ts",
  "packages/mcp/src/tools/kaiord-garmin-list.test.ts",
  "packages/mcp/src/tools/kaiord-garmin-login.test.ts",
  "packages/mcp/src/tools/kaiord-garmin-logout.test.ts",
  "packages/mcp/src/tools/kaiord-garmin-push.test.ts",
  "packages/mcp/src/tools/kaiord-get-format-spec.test.ts",
  "packages/mcp/src/tools/kaiord-inspect.test.ts",
  "packages/mcp/src/tools/kaiord-list-formats.test.ts",
  "packages/mcp/src/tools/kaiord-round-trip-validate.test.ts",
  "packages/mcp/src/tools/kaiord-validate.test.ts",
  "packages/mcp/src/types/tool-schemas.test.ts",
  "packages/mcp/src/utils/base64.test.ts",
  "packages/mcp/src/utils/error-formatter.test.ts",
  "packages/mcp/src/utils/file-io.test.ts",
  "packages/mcp/src/utils/format-registry.test.ts",
  "packages/mcp/src/utils/garmin-client-state.test.ts",
  "packages/mcp/src/utils/resolve-input.test.ts",
  "packages/tcx/src/adapters/duration/duration-kaiord-restorer.test.ts",
  "packages/tcx/src/adapters/duration/duration-standard-converter.test.ts",
  "packages/tcx/src/adapters/duration/duration-walker.converter.test.ts",
  "packages/tcx/src/adapters/duration/extended-duration.converter.test.ts",
  "packages/tcx/src/adapters/duration/krd-to-tcx.converter.test.ts",
  "packages/tcx/src/adapters/duration/standard-duration.converter.test.ts",
  "packages/tcx/src/adapters/duration/tcx-to-krd.converter.test.ts",
  "packages/tcx/src/adapters/fast-xml-parser.test.ts",
  "packages/tcx/src/adapters/round-trip/round-trip.test.ts",
  "packages/tcx/src/adapters/target/cadence.converter.test.ts",
  "packages/tcx/src/adapters/target/heart-rate.converter.test.ts",
  "packages/tcx/src/adapters/target/pace.converter.test.ts",
  "packages/tcx/src/adapters/target/tcx-target-walker.converter.test.ts",
  "packages/tcx/src/adapters/target/tcx-to-krd.converter.test.ts",
  "packages/tcx/src/adapters/workout/duration-to-tcx-encoder.test.ts",
  "packages/tcx/src/adapters/workout/krd.converter.test.ts",
  "packages/tcx/src/adapters/workout/metadata-builder.test.ts",
  "packages/tcx/src/adapters/workout/metadata-extractor.test.ts",
  "packages/tcx/src/adapters/workout/step-helpers.test.ts",
  "packages/tcx/src/adapters/workout/step-to-tcx.converter.test.ts",
  "packages/tcx/src/adapters/workout/step.converter.test.ts",
  "packages/tcx/src/adapters/workout/target-to-tcx.converter.test.ts",
  "packages/tcx/src/adapters/workout/tcx.converter.test.ts",
  "packages/tcx/src/adapters/workout/workout.converter.test.ts",
  "packages/zwo/src/adapters/fast-xml-parser.test.ts",
  "packages/zwo/src/adapters/krd-to-zwift.converter.test.ts",
  "packages/zwo/src/adapters/round-trip/round-trip.test.ts",
  "packages/zwo/src/adapters/round-trip/zwift-round-trip.test.ts",
  "packages/zwo/src/adapters/target/pace-cadence.converter.test.ts",
  "packages/zwo/src/adapters/target/power.converter.test.ts",
  "packages/zwo/src/adapters/xsd-validator.test.ts",
  "packages/zwo/src/adapters/zwift-to-krd.converter.test.ts",
]);

let AAA_ALLOWLIST_SPA_NON_COMPONENT = new Set([
  "packages/workout-spa-editor/src/adapters/analytics/cloudflare-analytics.test.ts",
  "packages/workout-spa-editor/src/adapters/bridge/bridge-discovery-verify.test.ts",
  "packages/workout-spa-editor/src/adapters/bridge/bridge-discovery.test.ts",
  "packages/workout-spa-editor/src/adapters/bridge/bridge-store-persistence-boundary.test.ts",
  "packages/workout-spa-editor/src/adapters/bridge/bridge-transport.test.ts",
  "packages/workout-spa-editor/src/adapters/bridge/operation-queue.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-auto-match-dismissal-repository.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-coaching-migration.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-coaching-repository.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-coaching-sync-state-repository.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-persistence-adapter.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-session-match-repository.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-strip-ids-integration.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-usage-migration.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-user-preferences-repository.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-v5-migration.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/dexie-v6-migration.test.ts",
  "packages/workout-spa-editor/src/adapters/dexie/is-per-profile-table.test.ts",
  "packages/workout-spa-editor/src/adapters/train2go/coaching-record-to-activity.converter.test.ts",
  "packages/workout-spa-editor/src/adapters/train2go/coaching-telemetry.test.ts",
  "packages/workout-spa-editor/src/adapters/train2go/train2go-coaching-transport.test.ts",
  "packages/workout-spa-editor/src/adapters/train2go/train2go-record.converter.test.ts",
  "packages/workout-spa-editor/src/adapters/train2go/train2go-sport-map.test.ts",
  "packages/workout-spa-editor/src/adapters/train2go/use-train2go-source.test.tsx",
  "packages/workout-spa-editor/src/application/ai-prompts.test.ts",
  "packages/workout-spa-editor/src/application/ai-workout-processor.test.ts",
  "packages/workout-spa-editor/src/application/ai/add-provider.test.ts",
  "packages/workout-spa-editor/src/application/ai/clear-all-providers.test.ts",
  "packages/workout-spa-editor/src/application/ai/remove-provider.test.ts",
  "packages/workout-spa-editor/src/application/ai/set-custom-prompt.test.ts",
  "packages/workout-spa-editor/src/application/ai/set-default-provider.test.ts",
  "packages/workout-spa-editor/src/application/ai/update-provider.test.ts",
  "packages/workout-spa-editor/src/application/auto-match-dismissal.test.ts",
  "packages/workout-spa-editor/src/application/auto-match-sessions.test.ts",
  "packages/workout-spa-editor/src/application/batch-processor.test.ts",
  "packages/workout-spa-editor/src/application/canonical-sport-family.test.ts",
  "packages/workout-spa-editor/src/application/coaching/attempt-link-helpers.test.ts",
  "packages/workout-spa-editor/src/application/coaching/coaching-transport-port.test.ts",
  "packages/workout-spa-editor/src/application/coaching/expand-day.test.ts",
  "packages/workout-spa-editor/src/application/coaching/sync-zones.test.ts",
  "packages/workout-spa-editor/src/application/coaching/use-cases.test.ts",
  "packages/workout-spa-editor/src/application/compliance-bucket.test.ts",
  "packages/workout-spa-editor/src/application/compute-compliance-score.test.ts",
  "packages/workout-spa-editor/src/application/convert-and-auto-match.test.ts",
  "packages/workout-spa-editor/src/application/cost-estimation.test.ts",
  "packages/workout-spa-editor/src/application/get-user-preferences.test.ts",
  "packages/workout-spa-editor/src/application/library/add-template.test.ts",
  "packages/workout-spa-editor/src/application/library/delete-template.test.ts",
  "packages/workout-spa-editor/src/application/library/schedule-template.test.ts",
  "packages/workout-spa-editor/src/application/library/update-template.test.ts",
  "packages/workout-spa-editor/src/application/match-session.test.ts",
  "packages/workout-spa-editor/src/application/on-workout-mutation.test.ts",
  "packages/workout-spa-editor/src/application/parse-coaching-duration.test.ts",
  "packages/workout-spa-editor/src/application/profile/create-profile.test.ts",
  "packages/workout-spa-editor/src/application/profile/delete-profile-with-cascade.test.ts",
  "packages/workout-spa-editor/src/application/profile/delete-profile.cascade.integration.test.ts",
  "packages/workout-spa-editor/src/application/profile/delete-profile.test.ts",
  "packages/workout-spa-editor/src/application/profile/get-active-profile.test.ts",
  "packages/workout-spa-editor/src/application/profile/set-active-profile.test.ts",
  "packages/workout-spa-editor/src/application/profile/update-profile.test.ts",
  "packages/workout-spa-editor/src/application/profile/zones/zones.test.ts",
  "packages/workout-spa-editor/src/application/provider-rates.test.ts",
  "packages/workout-spa-editor/src/application/sanity-checks.test.ts",
  "packages/workout-spa-editor/src/application/set-calendar-density.test.ts",
  "packages/workout-spa-editor/src/application/stale-detection.integration.test.ts",
  "packages/workout-spa-editor/src/application/unmatch-session.test.ts",
  "packages/workout-spa-editor/src/application/workout-transitions.test.ts",
  "packages/workout-spa-editor/src/hooks/focus/apply-focus-to-element.test.ts",
  "packages/workout-spa-editor/src/hooks/focus/is-form-field-focused.test.ts",
  "packages/workout-spa-editor/src/hooks/focus/use-focus-after-action-telemetry.test.tsx",
  "packages/workout-spa-editor/src/hooks/focus/use-focus-after-action.test.tsx",
  "packages/workout-spa-editor/src/hooks/garmin-bridge-operations.test.ts",
  "packages/workout-spa-editor/src/hooks/use-active-profile-live.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-ai-custom-prompt-live.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-ai-providers-live.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-auto-match-suggestions.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-batch-cost-estimate.test.ts",
  "packages/workout-spa-editor/src/hooks/use-coaching-activities.test.ts",
  "packages/workout-spa-editor/src/hooks/use-coaching-auto-sync-helpers.test.ts",
  "packages/workout-spa-editor/src/hooks/use-coaching-auto-sync.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-focus-on-route-change.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-garmin-detection.test.ts",
  "packages/workout-spa-editor/src/hooks/use-latest-ref.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-lazy-dialog.test.ts",
  "packages/workout-spa-editor/src/hooks/use-library-templates-live.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-match-session.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-matched-sessions.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-profile-by-id-live.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-profiles-live.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-route-announcer-label.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-store-hydration.test.ts",
  "packages/workout-spa-editor/src/hooks/use-unmatch-session.test.tsx",
  "packages/workout-spa-editor/src/hooks/use-user-preferences.test.tsx",
  "packages/workout-spa-editor/src/hooks/useDeleteCleanup.test.ts",
  "packages/workout-spa-editor/src/hooks/useKeyboardShortcuts.test.ts",
  "packages/workout-spa-editor/src/hooks/useToast.test.ts",
  "packages/workout-spa-editor/src/lib/build-route-error-payload.test.ts",
  "packages/workout-spa-editor/src/lib/crypto.test.ts",
  "packages/workout-spa-editor/src/lib/focus/fallback-chain.test.ts",
  "packages/workout-spa-editor/src/lib/focus/overlay-observer.test.ts",
  "packages/workout-spa-editor/src/lib/generate-workout.test.ts",
  "packages/workout-spa-editor/src/lib/profile-snapshot/profile-to-snapshot.test.ts",
  "packages/workout-spa-editor/src/lib/provider-factory.test.ts",
  "packages/workout-spa-editor/src/lib/raw-hash.test.ts",
  "packages/workout-spa-editor/src/lib/scrub-analytics-string.test.ts",
  "packages/workout-spa-editor/src/lib/secure-storage.test.ts",
  "packages/workout-spa-editor/src/lib/zone-methods.test.ts",
  "packages/workout-spa-editor/src/store/actions/block-id-stability.test.ts",
  "packages/workout-spa-editor/src/store/actions/block-operations-integration.test.ts",
  "packages/workout-spa-editor/src/store/actions/copy-paste-integration.test.ts",
  "packages/workout-spa-editor/src/store/actions/copy-paste-performance.test.ts",
  "packages/workout-spa-editor/src/store/actions/copy-step-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/create-empty-repetition-block-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/create-repetition-block-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/creation-focus-intent.test.ts",
  "packages/workout-spa-editor/src/store/actions/delete-focus-intent.test.ts",
  "packages/workout-spa-editor/src/store/actions/delete-repetition-block-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/delete-step-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/duplicate-step-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/error-recovery-actions.test.ts",
  "packages/workout-spa-editor/src/store/actions/item-id-assignment.test.ts",
  "packages/workout-spa-editor/src/store/actions/paste-step-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/performance.test.ts",
  "packages/workout-spa-editor/src/store/actions/reorder-step-action.test.ts",
  "packages/workout-spa-editor/src/store/actions/reorder-steps-in-block-action.test.ts",
  "packages/workout-spa-editor/src/store/ai-runtime-store.test.ts",
  "packages/workout-spa-editor/src/store/clipboard-store.test.ts",
  "packages/workout-spa-editor/src/store/find-by-id.test.ts",
  "packages/workout-spa-editor/src/store/focus-rules/next-after-delete.test.ts",
  "packages/workout-spa-editor/src/store/focus-rules/next-after-multi-delete.test.ts",
  "packages/workout-spa-editor/src/store/focus-rules/preserved-selection.test.ts",
  "packages/workout-spa-editor/src/store/focus-rules/restored-after-undo.test.ts",
  "packages/workout-spa-editor/src/store/focus/focus-slice.test.ts",
  "packages/workout-spa-editor/src/store/focus/focus-target.types.test.ts",
  "packages/workout-spa-editor/src/store/garmin-extension-transport.test.ts",
  "packages/workout-spa-editor/src/store/hydrate-ui-workout.test.ts",
  "packages/workout-spa-editor/src/store/providers/focus-telemetry.test.ts",
  "packages/workout-spa-editor/src/store/providers/id-provider.test.ts",
  "packages/workout-spa-editor/src/store/providers/item-id.test.ts",
  "packages/workout-spa-editor/src/store/selection-invariant.test.ts",
  "packages/workout-spa-editor/src/store/storage-store.test.ts",
  "packages/workout-spa-editor/src/store/strip-ids.test.ts",
  "packages/workout-spa-editor/src/store/test-delete-exists.test.ts",
  "packages/workout-spa-editor/src/store/train2go-detect-integration.test.ts",
  "packages/workout-spa-editor/src/store/train2go-detect.test.ts",
  "packages/workout-spa-editor/src/store/train2go-extension-read-zones.test.ts",
  "packages/workout-spa-editor/src/store/train2go-extension-transport.test.ts",
  "packages/workout-spa-editor/src/store/train2go-pii-redaction.test.ts",
  "packages/workout-spa-editor/src/store/train2go-store-actions.test.ts",
  "packages/workout-spa-editor/src/store/workout-actions.test.ts",
  "packages/workout-spa-editor/src/store/workout-loading-integration.test.ts",
  "packages/workout-spa-editor/src/store/workout-store-history.test.ts",
  "packages/workout-spa-editor/src/store/workout-store-modal-actions.test.ts",
  "packages/workout-spa-editor/src/store/workout-store-recovery.test.ts",
  "packages/workout-spa-editor/src/store/workout-store-undo-history.test.ts",
  "packages/workout-spa-editor/src/store/workout-store.test.ts",
]);

let AAA_ALLOWLIST_SPA_COMPONENT = new Set([
  "packages/workout-spa-editor/src/App.test.tsx",
  "packages/workout-spa-editor/src/__perf__/profile-state-baseline.measure.test.tsx",
  "packages/workout-spa-editor/src/__regressions__/issue-385.test.tsx",
  "packages/workout-spa-editor/src/__regressions__/library-badge.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Badge/Badge.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Button/Button.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/ErrorMessage/ErrorMessage.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Icon/Icon.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Input/Input.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/ThemeToggle/ThemeToggle.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Toast/Toast.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Tooltip/Tooltip.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/BatchProcessingBanner/BatchMessage.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/BatchProcessingBanner/BatchProcessingBanner.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CalendarEmptyStates/CalendarEmptyStates.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CardShell/CardShell.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CardShell/contrast.test.ts",
  "packages/workout-spa-editor/src/components/molecules/CardShell/shared-visual-contract.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CardShell/status-tokens.test.ts",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityDialog.bootstrap.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingSyncButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/LinkedWorkoutSection.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/MatchToPicker.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-convert.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-dialog-actions.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-dialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ConfirmationModal/ConfirmationModal.accessibility.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ConfirmationModal/ConfirmationModal.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/DensityToggle/DensityToggle.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/EmptyDayDialog/EmptyDayDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/EmptyWorkoutState/EmptyWorkoutState.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ExportFormatSelector/ExportFormatSelector.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ExportFormatSelector/FormatDropdown.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/FileUpload/FileUpload.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/GarminPushButton/GarminPushButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/GarminPushButton/useGarminPush.test.ts",
  "packages/workout-spa-editor/src/components/molecules/MatchedSessionCard/MatchedSessionCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/PasteButton/PasteButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RawWorkoutDialog/RawWorkoutDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RawWorkoutDialog/raw-workout-hooks.test.ts",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.accessibility.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.integration.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.property.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockSteps.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RouteErrorBoundary.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RouteErrorFallback.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/SaveButton/SaveButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/SaveButton/save-handler.analytics.test.ts",
  "packages/workout-spa-editor/src/components/molecules/SaveToLibraryButton/generate-thumbnail.test.ts",
  "packages/workout-spa-editor/src/components/molecules/SelectionIndicator/SelectionIndicator.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StepCard/CopyButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StepCard/StepCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StepNotesEditor/StepNotesEditor.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StorageAvailabilityBanner/StorageAvailabilityBanner.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/SwimmingStepEditor/SwimmingStepEditor.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/TargetPicker/TargetPicker.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/TemplatePickerDialog/TemplatePickerDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/UndoRedoButtons/UndoRedoButtons.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/WorkoutCard/WorkoutCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/WorkoutCard/workout-card-utils.test.ts",
  "packages/workout-spa-editor/src/components/molecules/WorkoutMetadataEditor/WorkoutMetadataEditor.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/WorkoutPreview/WorkoutPreview.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/delete-button-styling.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/AiWorkoutInput.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/ZoneIndicator.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/useAiGeneration.analytics.test.ts",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/zones-formatter.test.ts",
  "packages/workout-spa-editor/src/components/organisms/AutoMatchBanner/AutoMatchBanner.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/BatchCostConfirmation/BatchCostConfirmation.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/EditorContextMenu/EditorContextMenuContent.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/OnboardingTutorial/OnboardingTutorial.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ProfileManager/ProfileManager.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ProfileManager/components/LinkedAccountsSection.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/BridgeStatusRow.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/SettingsPanel.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/UsageEmptyState.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/UsageTab.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/UsageTable.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/use-ai-tab-handlers.audit.test.ts",
  "packages/workout-spa-editor/src/components/organisms/StepEditor/FirstTimeHints.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/StepEditor/StepEditor.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.drag-integration.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.integration.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.multi-selection.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.selection.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/use-workout-list-dnd.test.ts",
  "packages/workout-spa-editor/src/components/organisms/WorkoutStats/WorkoutStats.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/SportZoneEditor.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/ZoneEditor.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/components/EditableZoneName.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/components/EditableZoneValue.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/utils/parse-zone-field.test.ts",
  "packages/workout-spa-editor/src/components/pages/CalendarHeader.test.tsx",
  "packages/workout-spa-editor/src/components/pages/CalendarPage.test.tsx",
  "packages/workout-spa-editor/src/components/pages/CalendarWeekGrid.test.tsx",
  "packages/workout-spa-editor/src/components/pages/EditorNewWorkout.analytics.test.tsx",
  "packages/workout-spa-editor/src/components/pages/EditorPage.test.tsx",
  "packages/workout-spa-editor/src/components/pages/HelpSection/HelpSection.test.tsx",
  "packages/workout-spa-editor/src/components/pages/LibraryPage.test.tsx",
  "packages/workout-spa-editor/src/components/pages/ManualCreateSection.analytics.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutActions.property.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutActions.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutHeader.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutSection.focus-integration.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutStepsListActions.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/use-delete-step-with-toast.test.ts",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/useWorkoutSectionHandlers.test.ts",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/useWorkoutSectionState.test.ts",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/workout-section-handlers-helpers.test.ts",
  "packages/workout-spa-editor/src/components/pages/batch-prepare.test.ts",
  "packages/workout-spa-editor/src/components/pages/calendar-utils.test.ts",
  "packages/workout-spa-editor/src/components/pages/save-as-template.test.ts",
  "packages/workout-spa-editor/src/components/pages/use-batch-runner.test.ts",
  "packages/workout-spa-editor/src/components/pages/use-batch-state.test.ts",
  "packages/workout-spa-editor/src/components/pages/use-editor-actions.test.ts",
  "packages/workout-spa-editor/src/components/templates/MainLayout/LayoutHeader.test.tsx",
  "packages/workout-spa-editor/src/components/templates/MainLayout/MainLayout.test.tsx",
  "packages/workout-spa-editor/src/components/templates/MainLayout/components/MobileMenuPanel.test.tsx",
  "packages/workout-spa-editor/src/contexts/ThemeContext.test.tsx",
  "packages/workout-spa-editor/src/contexts/analytics-context.test.tsx",
  "packages/workout-spa-editor/src/contexts/coaching-registry-bootstrap.test.tsx",
  "packages/workout-spa-editor/src/contexts/focus-registry-context.test.tsx",
  "packages/workout-spa-editor/src/contexts/garmin-bridge-context.test.tsx",
  "packages/workout-spa-editor/src/contexts/settings-dialog-context.test.tsx",
  "packages/workout-spa-editor/src/router-base.test.tsx",
  "packages/workout-spa-editor/src/routes.test.tsx",
  "packages/workout-spa-editor/src/types/auto-match-dismissal.test.ts",
  "packages/workout-spa-editor/src/types/bridge-schemas.test.ts",
  "packages/workout-spa-editor/src/types/calendar-schemas.test.ts",
  "packages/workout-spa-editor/src/types/coaching-account.test.ts",
  "packages/workout-spa-editor/src/types/coaching-activity-record.test.ts",
  "packages/workout-spa-editor/src/types/errors.test.ts",
  "packages/workout-spa-editor/src/types/krd-guards.test.ts",
  "packages/workout-spa-editor/src/types/krd.test.ts",
  "packages/workout-spa-editor/src/types/schemas/repetition-block-id.test.ts",
  "packages/workout-spa-editor/src/types/session-match-errors.test.ts",
  "packages/workout-spa-editor/src/types/session-match.test.ts",
  "packages/workout-spa-editor/src/types/ui-workout.test.ts",
  "packages/workout-spa-editor/src/types/usage-schemas.test.ts",
  "packages/workout-spa-editor/src/types/user-preferences.test.ts",
  "packages/workout-spa-editor/src/types/validation.test.ts",
  "packages/workout-spa-editor/src/types/validation/helpers.test.ts",
  "packages/workout-spa-editor/src/utils/build-keyboard-handlers.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-hr-zones.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-pace-zones.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-power-zones.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-zone-values.test.ts",
  "packages/workout-spa-editor/src/utils/export-workout.test.ts",
  "packages/workout-spa-editor/src/utils/format-relative-time.test.ts",
  "packages/workout-spa-editor/src/utils/format-week-label.test.ts",
  "packages/workout-spa-editor/src/utils/id-generation.test.ts",
  "packages/workout-spa-editor/src/utils/import-workout.test.ts",
  "packages/workout-spa-editor/src/utils/json-parser.test.ts",
  "packages/workout-spa-editor/src/utils/krd-validator.test.ts",
  "packages/workout-spa-editor/src/utils/library-storage.test.ts",
  "packages/workout-spa-editor/src/utils/no-browser-alerts.test.ts",
  "packages/workout-spa-editor/src/utils/profile-storage.test.ts",
  "packages/workout-spa-editor/src/utils/week-utils.test.ts",
  "packages/workout-spa-editor/src/utils/workout-stats.test.ts",
]);

export function __setAllowlistsForTest({
  BACKEND,
  SPA_NON_COMPONENT,
  SPA_COMPONENT,
}) {
  AAA_ALLOWLIST_BACKEND = BACKEND;
  AAA_ALLOWLIST_SPA_NON_COMPONENT = SPA_NON_COMPONENT;
  AAA_ALLOWLIST_SPA_COMPONENT = SPA_COMPONENT;
}

const EXCLUDED_FRAGMENTS = [
  "/node_modules/",
  "/dist/",
  "/coverage/",
  "/test-utils/",
  "/e2e/",
  "/.storybook/",
];
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

function isInScope(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (EXCLUDED_FRAGMENTS.some((frag) => p.includes(frag))) return false;
  if (p.startsWith("node_modules/")) return false;
  if (p.startsWith("dist/")) return false;
  if (p.startsWith("coverage/")) return false;
  if (p.endsWith(".stories.ts") || p.endsWith(".stories.tsx")) return false;
  const base = p.split("/").pop();
  if (EXCLUDED_BASENAMES.has(base)) return false;
  if (!p.endsWith(".test.ts") && !p.endsWith(".test.tsx")) return false;
  return true;
}

const SPA_NON_COMPONENT_PREFIXES = [
  "packages/workout-spa-editor/src/application/",
  "packages/workout-spa-editor/src/adapters/",
  "packages/workout-spa-editor/src/store/",
  "packages/workout-spa-editor/src/hooks/",
  "packages/workout-spa-editor/src/lib/",
];
const SPA_COMPONENT_PREFIXES = [
  "packages/workout-spa-editor/src/components/",
  "packages/workout-spa-editor/src/pages/",
];

export function inferShard(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (p.startsWith("packages/workout-spa-editor/")) {
    if (SPA_NON_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_NON_COMPONENT";
    if (SPA_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_COMPONENT";
    return "SPA_COMPONENT";
  }
  return "BACKEND";
}

const IT_CALL_RE = /\bit\b(?:\.[a-z]+)?\s*\(/g;
const ARRANGE_RE = /^\s*\/\/\s+Arrange\s*$/gm;
const ACT_RE = /^\s*\/\/\s+Act\s*$/gm;
const ASSERT_RE = /^\s*\/\/\s+Assert\s*$/gm;

export function hasCanonicalMarkers(source) {
  const itCount = (source.match(IT_CALL_RE) || []).length;
  if (itCount === 0) return true;
  const arrangeCount = (source.match(ARRANGE_RE) || []).length;
  if (arrangeCount < itCount) return false;
  const actCount = (source.match(ACT_RE) || []).length;
  if (actCount < itCount) return false;
  const assertCount = (source.match(ASSERT_RE) || []).length;
  if (assertCount < itCount) return false;
  return true;
}

function isAllowlisted(repoRelPath) {
  return (
    AAA_ALLOWLIST_BACKEND.has(repoRelPath) ||
    AAA_ALLOWLIST_SPA_NON_COMPONENT.has(repoRelPath) ||
    AAA_ALLOWLIST_SPA_COMPONENT.has(repoRelPath)
  );
}

function findFiles({ packagesDir = PACKAGES_DIR } = {}) {
  const files = [];
  if (!existsSync(packagesDir)) return files;
  walk(packagesDir, files);
  return files;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(REPO_ROOT, full).replaceAll("\\", "/");
    if (EXCLUDED_FRAGMENTS.some((frag) => rel.includes(frag))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isInScope(rel)) continue;
    out.push(full);
  }
}

export function collectAaaViolations({
  packagesDir = PACKAGES_DIR,
  repoRoot = REPO_ROOT,
  files,
} = {}) {
  const targetFiles =
    files !== undefined ? files : findFiles({ packagesDir });
  const violations = [];
  for (const file of targetFiles) {
    const rel = relative(repoRoot, file).replaceAll("\\", "/");
    if (!isInScope(rel)) continue;
    if (isAllowlisted(rel)) continue;
    const source = readFileSync(file, "utf8");
    if (!hasCanonicalMarkers(source)) {
      violations.push({ path: rel, shard: inferShard(rel) });
    }
  }
  return { violations };
}

function gitChangedTestFiles() {
  try {
    const out = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    ).trim();
    if (!out) return [];
    return out
      .split(/\n/)
      .filter((p) => isInScope(p))
      .map((p) => resolve(REPO_ROOT, p));
  } catch {
    return [];
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changedFilesMode = process.argv.includes("--changed-files");
  const opts = changedFilesMode ? { files: gitChangedTestFiles() } : {};
  if (changedFilesMode && opts.files.length === 0) {
    process.exit(0);
  }
  const { violations } = collectAaaViolations(opts);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(
        `R-ItBodyAAA: ${v.path} — file is missing AAA markers (or markers out of order); see openspec/specs/test-conventions/spec.md for the canonical form.`
      );
    }
    console.error(
      `\n${violations.length} AAA violation(s). Each it() body MUST contain canonical Pascal-case // Arrange, // Act, // Assert line comments.`
    );
    process.exit(1);
  }
  if (!changedFilesMode) {
    console.log(
      `[check-test-aaa] all in-scope test files contain canonical AAA markers.`
    );
  }
}
