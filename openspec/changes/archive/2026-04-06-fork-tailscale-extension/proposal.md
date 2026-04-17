> Completed: 2026-04-06

# Proposal: Fork tailscale-lambda-extension with exit-node and advertise-tags support

## Problem

The `tailscale-lambda-extension` CDK construct (v0.0.8 by rehanvdm) only supports `--authkey` and `--hostname` in its `tailscale up` command. This forces two workarounds in `@kaiord/infra`:

1. **Exit node:** Handler calls `tailscale set --exit-node` at runtime via `execFileSync` (`tailscale-exit-node.ts`). Adds ~1s to cold start and runtime complexity.
2. **Auth key rotation:** Must use auth keys (90-day max expiry) instead of OAuth client keys (no expiry). Requires manual rotation every 90 days.

## Solution

Fork `rehanvdm/tailscale-lambda-extension` to add:

1. **`TS_EXIT_NODE` support** — run `tailscale set --exit-node` during extension initialization (before handler starts)
2. **`TS_ADVERTISE_TAGS` support** — pass `--advertise-tags` to `tailscale up`, enabling OAuth client keys

Then:

- Use the fork in `@kaiord/infra`, removing workaround code
- Submit PR upstream to `rehanvdm/tailscale-lambda-extension`
- Switch from auth key to OAuth client key (no expiry)

## Affected Packages

| Package                             | Change                                               |
| ----------------------------------- | ---------------------------------------------------- |
| `tailscale-lambda-extension` (fork) | Shell script + CDK props + README                    |
| `@kaiord/infra`                     | Switch to fork, remove workarounds, OAuth client key |

## Breaking Changes

None. New props are optional. Existing usage unchanged.

## Constraints

- Keep Projen build system (upstream compatibility)
- Apache-2.0 license (upstream requirement)
- Backward compatible (all new features optional)
- Must pass upstream's existing tests + new tests
- Shell script changes must work on Amazon Linux 2023
