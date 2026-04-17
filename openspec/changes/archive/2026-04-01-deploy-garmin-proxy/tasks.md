# Tasks: Deploy Garmin Proxy Lambda

## Prerequisites (manual, one-time)

- [ ] Create AWS IAM OIDC identity provider for `token.actions.githubusercontent.com`
- [ ] Create IAM role `github-actions-kaiord-deploy` with trust policy (main branch only)
- [ ] Attach least-privilege deployment policy to the IAM role (CloudFormation, Lambda, API Gateway, Logs, S3, IAM PassRole, CloudWatch)
- [ ] Run `cdk bootstrap` in the target AWS account/region
- [ ] Add GitHub repository variables: `AWS_ACCOUNT_ID`, `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`
- [ ] Add GitHub repository variable: `SPA_ORIGIN` (GitHub Pages URL for CORS)
- [ ] After first deploy: retrieve API Gateway URL from CDK output, set `VITE_GARMIN_LAMBDA_URL` GitHub variable, and trigger SPA workflow

## Adapters: Infra Stack

- [x] Add `cdk.out/` to `.gitignore` (repo root)
- [x] Add `CfnOutput` to `GarminProxyStack` that exports the API Gateway URL (construct from `api.apiId` + region since `createDefaultStage: false`)
- [x] Add CloudWatch alarm for API Gateway 5xx errors (threshold: 5 in 5 min)
- [x] Add CloudWatch alarm for Lambda invocation errors (threshold: 5 in 5 min)
- [x] Pin `aws-cdk` CLI as devDependency in `packages/infra/package.json` (already pinned)
- [x] Test: verify `cdk synth` produces valid CloudFormation template with outputs and alarms

## Adapters: Lambda Hardening

- [x] Add payload size check in `handler.ts`: reject body > 512 KB with 413 before `JSON.parse`
- [x] Add structured logging with `requestId` to error path (no credential data)
- [x] Add code comment in `handler.ts` warning against logging request bodies or error messages
- [x] Test: verify 413 response for oversized payload
- [x] Test: verify error log contains requestId but no sensitive data

## Adapters: SPA Configuration

- [x] Replace hardcoded `DEFAULT_LAMBDA_URL` in `garmin-store.ts` with `import.meta.env.VITE_GARMIN_LAMBDA_URL || ""`
- [x] Add stale URL migration in `garmin-store-actions.ts`: treat persisted `"https://api.kaiord.com/push"` as empty string on hydrate
- [x] Update `GarminLambdaInput.tsx` placeholder to `https://xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/push`
- [x] Verify `GarminPushButton` shows "Configure Garmin" state when URL is empty (not just disabled)
- [x] Update `garmin-store.test.ts` to test both env-var-set and env-var-unset scenarios
- [x] Update `garmin-store.test.ts` to test stale URL migration
- [x] Update `garmin-store-actions.test.ts` for new default behavior and migration
- [x] Update `garmin-push.test.ts` with updated default
- [x] Update `GarminPushButton.test.tsx` with updated default
- [x] Update e2e tests (`settings.spec.ts`, `api-mocks.ts`) for new default

## CI/CD: Deploy Workflow

- [x] Create `.github/workflows/deploy-infra.yml` with:
  - OIDC authentication via `aws-actions/configure-aws-credentials@v4`
  - Path filter: `packages/infra/**`
  - `workflow_dispatch` support
  - Concurrency group: `infra-deploy` (cancel-in-progress: false)
  - `cdk deploy --require-approval never --context allowedOrigins`
  - Post-deploy smoke test (POST empty body, expect 400 not 5xx)
- [x] Add `VITE_GARMIN_LAMBDA_URL` env var to `deploy-spa-editor.yml` build step (from GitHub variable)

## Documentation

- [x] Update `packages/infra/README.md` with:
  - OIDC setup instructions (IAM provider + role + policy)
  - Cross-pipeline coupling: infra deploy → set URL variable → trigger SPA deploy
  - Credential handling documentation (stateless, never stored, never logged)
  - Expected latency (5-15s per push due to SSO login)
  - Throttle behavior and limitations (10 req/s global, not per-IP)
- [x] Add changeset for `@kaiord/infra` (minor: CfnOutput, alarms, payload limit)
- [x] Add changeset for `@kaiord/workout-spa-editor` (patch: fix default Lambda URL, stale URL migration)
