# Design: Fork tailscale-lambda-extension

## Decision 1: Public fork on GitHub

**Choice:** Fork `rehanvdm/tailscale-lambda-extension` to `pablo-albaladejo/tailscale-lambda-extension`. Make changes on a feature branch, then submit PR upstream.

**Rationale:** Public fork enables contributing back. While waiting for upstream merge, kaiord uses the fork via npm. If upstream merges, switch back to the official package.

**Alternatives considered:**
- **Monorepo package:** Harder to contribute upstream, duplicates build infrastructure
- **Patch-package:** Fragile, breaks on updates, can't test independently

## Decision 2: Single feature branch, single PR upstream

**Choice:** One branch `feature/advertise-tags-exit-node` with both features. One PR to upstream.

**Rationale:** Both features are small, related (Tailscale network configuration), and backward compatible. Splitting would create unnecessary review overhead for the maintainer.

## Decision 3: Keep Projen

**Choice:** Keep the Projen build system. Edit `.projenrc.ts`, run `npx projen` to regenerate.

**Rationale:** Projen is how upstream manages the project. Ejecting would make the PR incompatible. Upstream uses Projen for CI, releases, and cross-language support (JSII).

## Decision 4: Shell script modifications

**Layer:** Extension shell script (`extensions/tailscale-extension`)

**Changes to the `tailscale up` section:**

```bash
# Current:
/opt/extensions/bin/tailscale --socket=/tmp/tailscale.sock up \
  --authkey="${TS_KEY}" \
  --hostname="${TS_HOSTNAME}"

# Modified:
EXTRA_ARGS=""
if [ -n "${TS_ADVERTISE_TAGS:-}" ]; then
  EXTRA_ARGS="${EXTRA_ARGS} --advertise-tags=${TS_ADVERTISE_TAGS}"
fi
/opt/extensions/bin/tailscale --socket=/tmp/tailscale.sock up \
  --authkey="${TS_KEY}" \
  --hostname="${TS_HOSTNAME}" \
  ${EXTRA_ARGS}
```

**New section after `tailscale up`:**

```bash
# Configure exit node if specified
if [ -n "${TS_EXIT_NODE:-}" ]; then
  echo "[${LAMBDA_EXTENSION_NAME}] Setting exit node: ${TS_EXIT_NODE}" 1>&2
  /opt/extensions/bin/tailscale --socket=/tmp/tailscale.sock set \
    --exit-node="${TS_EXIT_NODE}"

  # Wait for exit node to come online (max 10s)
  for i in $(seq 1 20); do
    STATUS=$(/opt/extensions/bin/tailscale --socket=/tmp/tailscale.sock status --json 2>/dev/null || echo "{}")
    if echo "${STATUS}" | grep -q '"Online":true'; then
      echo "[${LAMBDA_EXTENSION_NAME}] Exit node online" 1>&2
      break
    fi
    sleep 0.5
  done
fi
```

## Decision 5: CDK construct changes

**Layer:** CDK TypeScript construct

**New props interface:**

```typescript
export interface TailscaleLambdaExtensionProps {
  readonly options?: lambda.LayerVersionOptions;
  /**
   * Tailscale tags to advertise (e.g., "tag:lambda,tag:prod").
   * Required when using OAuth client keys instead of auth keys.
   * Sets the TS_ADVERTISE_TAGS environment variable.
   */
  readonly advertiseTags?: string;
  /**
   * Tailscale exit node hostname or IP address.
   * Configures all traffic to route through this exit node.
   * Sets the TS_EXIT_NODE environment variable.
   */
  readonly exitNode?: string;
}
```

**Note:** The construct does NOT set environment variables itself — it only creates the Lambda Layer. The user must set `TS_ADVERTISE_TAGS` and `TS_EXIT_NODE` as Lambda environment variables manually (or via a helper method). This matches the current pattern where `TS_SECRET_API_KEY` and `TS_HOSTNAME` are set by the user, not the construct.

**Alternative:** Add a `configureFunction(fn: lambda.Function)` helper that sets all required env vars. This is a nice-to-have for a follow-up PR.

## Decision 6: Publishing strategy

**Choice:** Publish fork as `@pablo-albaladejo/tailscale-lambda-extension` on npm during the upstream PR review period.

**Kaiord uses:**
```json
"tailscale-lambda-extension": "npm:@pablo-albaladejo/tailscale-lambda-extension@^0.1.0"
```

**When upstream merges:** Switch back to `tailscale-lambda-extension@^0.1.0` (or whatever version includes the features).

## Decision 7: Migration plan for kaiord

### Phase 1: Use fork

1. Switch dependency to fork
2. Update CDK stack to pass `TS_ADVERTISE_TAGS` env var
3. Keep `TS_EXIT_NODE` env var (now handled by extension, not handler)

### Phase 2: Remove workarounds

1. Delete `tailscale-exit-node.ts` and its test
2. Remove `ensureExitNode()` call from `handler.ts`
3. Remove `ensureExitNode` import

### Phase 3: Switch to OAuth client key

1. Create OAuth client key in Tailscale admin (no expiry)
2. Update Secrets Manager secret
3. Remove auth key rotation reminder

### Phase 4: Update documentation

1. Update `SOLUTION.md` with fork migration
2. Update `design.md` to reflect no workaround needed
3. Update `packages/infra/README.md`

## Architecture after migration

```text
Browser (SPA)
  │
  ▼
API Gateway
  │
  ▼
AWS Lambda (Node.js 24)
  ├─ tailscale-lambda-extension (FORKED - Lambda Layer)
  │   ├─ tailscaled --tun=userspace-networking --socks5-server=:1055
  │   ├─ tailscale up --authkey=<OAuth key> --hostname=garmin-proxy-lambda
  │   │                --advertise-tags=tag:lambda       ← NEW
  │   └─ tailscale set --exit-node=100.116.150.51       ← NEW (in extension, not handler)
  │
  ├─ enableSocksProxy() → setGlobalDispatcher(socksDispatcher(...))
  ├─ checkTunnelHealth()
  └─ pushToGarmin() → Garmin Connect (via residential IP)
```

## References

- [rehanvdm/tailscale-lambda-extension](https://github.com/rehanvdm/tailscale-lambda-extension)
- [Projen documentation](https://projen.io/)
- [JSII (cross-language CDK)](https://aws.github.io/jsii/)
- [Tailscale CLI: tailscale set](https://tailscale.com/docs/reference/tailscale-cli/set)
- [Tailscale CLI: --advertise-tags](https://tailscale.com/docs/reference/tailscale-cli/up#--advertise-tags)
