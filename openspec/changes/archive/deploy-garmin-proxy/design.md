# Design: Deploy Garmin Proxy Lambda

## Decision 1: OIDC Federation over Static Credentials

**Layer:** CI/CD (infrastructure)

**Choice:** GitHub Actions OIDC federation with AWS IAM

**Rationale:** AWS and GitHub both recommend OIDC as the standard for CI/CD authentication. No long-lived secrets to rotate, tokens are single-use and expire in ~5 minutes. The `aws-actions/configure-aws-credentials@v4` action handles the token exchange.

**Alternative considered:** Storing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub secrets — rejected because keys don't expire, can be exfiltrated, and require manual rotation.

**Setup (one-time manual):**

1. Create OIDC identity provider in AWS IAM:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. Create IAM role `github-actions-kaiord-deploy` with trust policy:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:OWNER/kaiord:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

3. Attach least-privilege policy (CloudFormation, Lambda, API Gateway, Logs, S3, IAM PassRole, CloudWatch)

4. Store role ARN and AWS account ID as GitHub repository variables (not secrets — they're not sensitive)

## Decision 2: Auto-Generated API Gateway URL (No Custom Domain)

**Layer:** Adapters (infra)

**Choice:** Use the auto-generated API Gateway URL (`https://xxxxx.execute-api.REGION.amazonaws.com/push`). No custom domain.

**Rationale:** Avoids the cost and complexity of domain registration, Route53 hosted zone, and ACM certificates. The URL is stable as long as the stack exists (redeployments don't change it).

**Trade-off:** The URL is long and not branded, but it's only used as a backend endpoint — users never see it unless they check SPA settings. If the stack is ever destroyed and recreated, the URL changes and the SPA must be rebuilt with the new value.

**CDK addition:** A `CfnOutput` that exports the API URL. Since the stack uses `createDefaultStage: false` with a custom `HttpStage`, the URL must be constructed from the API ID and region (not from `api.url` which may be undefined):

```typescript
new CfnOutput(this, "ApiUrl", {
  value: `https://${api.apiId}.execute-api.${this.region}.amazonaws.com`,
  description: "Garmin proxy API Gateway URL",
});
```

**Cross-pipeline coupling:** After first infra deploy, the operator must:

1. Retrieve the API URL from the CDK/CloudFormation output
2. Set `VITE_GARMIN_LAMBDA_URL` as a GitHub repository variable (with `/push` appended)
3. Manually trigger the `deploy-spa-editor.yml` workflow to rebuild the SPA with the new URL

This coupling is documented in the infra README.

## Decision 3: SPA URL via Build-Time Environment Variable

**Layer:** Adapters (SPA)

**Choice:** Replace hardcoded `https://api.kaiord.com/push` with `import.meta.env.VITE_GARMIN_LAMBDA_URL`.

**Rationale:** The GitHub Pages deploy workflow can set this env var at build time. Local development and self-hosted builds can omit it, forcing users to configure their own URL.

**Migration:** Users who previously had the broken `https://api.kaiord.com/push` persisted in localStorage will have it treated as empty on hydrate, falling back to the env var default.

**Changes:**

- `garmin-store.ts`: `const DEFAULT_LAMBDA_URL = import.meta.env.VITE_GARMIN_LAMBDA_URL || ""`
- `garmin-store-actions.ts`: On hydrate, treat `"https://api.kaiord.com/push"` as empty string
- `deploy-spa-editor.yml`: Add `VITE_GARMIN_LAMBDA_URL` env var to SPA build step (value stored as GitHub variable)
- Tests: Update mocks for new default behavior

## Decision 4: CORS Lockdown

**Layer:** Adapters (infra)

**Choice:** The deploy workflow passes `--context allowedOrigins='["GITHUB_PAGES_URL"]'` to `cdk deploy`.

**Rationale:** The current stack defaults to `["*"]`, which would allow any website to send requests to the credential-accepting proxy. Locking CORS to the actual SPA origin prevents abuse from malicious sites.

**Implementation:** The GitHub Pages URL is stored as a GitHub repository variable `SPA_ORIGIN` and injected into the CDK deploy command.

## Decision 5: Monitoring

**Layer:** Adapters (infra)

**Choice:** Add CloudWatch alarms to the CDK stack for API Gateway 5xx errors and Lambda invocation errors.

**Rationale:** A public Lambda handling credentials needs minimum observability. Alarms provide early warning of broken deploys, Garmin API outages, or abuse.

**Implementation:**

- Alarm on API Gateway `5xx` metric (threshold: 5 errors in 5 minutes)
- Alarm on Lambda `Errors` metric (threshold: 5 errors in 5 minutes)
- No SNS topic initially — alarms visible in CloudWatch console. SNS can be added later.

## Decision 6: Deploy Workflow Structure

**Layer:** CI/CD

**Choice:** New workflow `deploy-infra.yml`, triggered on push to main (path-filtered to `packages/infra/**`) and `workflow_dispatch`.

**Concurrency:** `concurrency: { group: "infra-deploy", cancel-in-progress: false }` prevents parallel CDK deploys.

**Steps:**

1. Checkout
2. Setup pnpm + Node.js 24
3. Install dependencies
4. Configure AWS credentials (OIDC)
5. Build infra package dependencies (`pnpm -r build --filter @kaiord/infra...`)
6. `cdk deploy --require-approval never --context allowedOrigins='["$SPA_ORIGIN"]'`
7. Smoke test: `curl -sf -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' $API_URL/push` — expect 400 (not 5xx)

**CDK CLI version:** Uses the version pinned in `packages/infra/package.json` as a devDependency via `npx cdk`.

**Region:** Configurable via GitHub variable `AWS_REGION` (default: `eu-west-1`)

**Note:** `cdk bootstrap` is a one-time manual prerequisite, not run in the workflow (avoids 15-20s overhead on every deploy).

## Decision 7: Lambda Hardening

**Layer:** Adapters (infra)

**Choice:** Add payload size limit and credential safety guards to the handler.

**Payload limit:** Reject bodies > 512 KB with 413 before JSON.parse. KRD workout documents are typically 1-50 KB; 512 KB provides generous headroom.

**Credential safety:** Add a comment in `handler.ts` warning against logging request bodies or error messages (which could contain credentials from Garmin SSO errors). The existing `console.error("Garmin push failed")` is safe (logs a static string only). Enhance it with `requestId` for traceability without logging sensitive data.

**Structured logging:**

```typescript
console.error("Garmin push failed", {
  requestId: event.requestContext?.requestId,
  errorType: error instanceof Error ? error.constructor.name : "unknown",
});
```
