# Tasks: Lambda Tailscale exit node routing

## 1. Tailscale CDK construct setup

- [ ] 1.1 Install `tailscale-lambda-extension` npm package in `packages/infra`
- [ ] 1.2 Install `socks-proxy-agent` npm package in `packages/infra`

## 2. CDK Stack changes

- [ ] 2.1 Add `TailscaleLambdaExtension` construct to the stack
- [ ] 2.2 Create Secrets Manager secret for Tailscale API key (or reference existing)
- [ ] 2.3 Add `TS_SECRET_API_KEY` env var (secret name, not value)
- [ ] 2.4 Add `TS_EXIT_NODE` env var (exit node hostname)
- [ ] 2.5 Increase memory from 256 to 512 MB
- [ ] 2.6 Increase timeout from 30 to 60 seconds
- [ ] 2.7 Set reserved concurrency to 5
- [ ] 2.8 Keep `minify: false` and `sourceMap: true`

## 3. Lambda handler changes

- [ ] 3.1 Create `packages/infra/src/lambda/proxy-fetch.ts` — SOCKS5-aware fetch wrapper using `socks-proxy-agent`
- [ ] 3.2 Add tunnel health check: verify SOCKS5 connectivity before each request
- [ ] 3.3 Update `garmin-push.ts` to use proxy fetch
- [ ] 3.4 Update `handler.ts` with 503 response for tunnel unavailable
- [ ] 3.5 Add `errorMessage` to error logging (already done in debug deploy)
- [ ] 3.6 Improve error classification: add 429 handling to `isAuthError` or create `isRateLimited`

## 4. Tailscale admin configuration (manual)

- [ ] 4.1 Create Tailscale API key for Lambda (ephemeral, `tag:lambda`)
- [ ] 4.2 Store API key in AWS Secrets Manager
- [ ] 4.3 Configure Tailscale ACLs: `tag:lambda` → `autogroup:internet:*` only
- [ ] 4.4 Verify Raspberry Pi exit node is advertised and approved

## 5. Deploy workflow

- [ ] 5.1 Update `deploy-infra.yml` to pass `TS_EXIT_NODE` as CDK context
- [ ] 5.2 Add `TS_EXIT_NODE` to GitHub repository variables (non-sensitive)

## 6. Tests

- [ ] 6.1 Unit test `proxy-fetch.ts` — verify SOCKS5 agent is attached
- [ ] 6.2 Unit test handler 503 response when tunnel unavailable
- [ ] 6.3 Update existing handler tests for new error classification
- [ ] 6.4 Integration test: deploy to AWS and verify push succeeds (manual)
- [ ] 6.5 Verify DNS resolution of Garmin domains through tunnel

## 7. Documentation

- [ ] 7.1 Update `packages/infra/README.md` with Tailscale setup instructions
- [ ] 7.2 Document Secrets Manager secret name and rotation procedure
- [ ] 7.3 Document Tailscale ACL requirements for `tag:lambda`
- [ ] 7.4 Document cold start expectations (5-10s overhead)

## 8. Changeset

- [ ] 8.1 Create changeset for `@kaiord/infra` (minor: route Lambda through Tailscale exit node)
