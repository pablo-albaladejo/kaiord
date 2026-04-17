# Deployment Spec

## Requirements

### Requirement: OIDC Federation

GitHub Actions SHALL authenticate with AWS using OIDC federation (OpenID Connect). Long-lived AWS access keys MUST NOT be stored as GitHub secrets.

### Requirement: Automated Deploy on Main

The Lambda proxy SHALL be deployed automatically when changes to `packages/infra/**` are pushed to the `main` branch. The workflow SHALL also support manual trigger via `workflow_dispatch`.

### Requirement: Deploy Concurrency Control

The deploy workflow SHALL use a concurrency group to prevent parallel CDK deploys. In-progress deployments MUST NOT be cancelled.

### Requirement: SPA Lambda URL Configuration

The SPA SHALL read the Lambda URL from the environment variable `VITE_GARMIN_LAMBDA_URL` at build time. When the variable is set, it SHALL be used as the default. When not set, the default SHALL be empty, requiring the user to configure the URL in settings.

### Requirement: Stale URL Migration

If the user has the old non-functional URL `https://api.kaiord.com/push` persisted in localStorage, the SPA SHALL treat it as empty and fall back to the environment variable default or empty string.

### Requirement: CDK Output Exclusion

`cdk.out/` SHALL be listed in `.gitignore` at the repository root.

### Requirement: API URL Output

The CDK stack SHALL export the API Gateway URL as a CloudFormation output so it can be retrieved after deployment and used to configure the SPA build.

### Requirement: CORS Lockdown

The deploy workflow MUST pass `--context allowedOrigins` with the specific GitHub Pages SPA origin. The CORS wildcard (`*`) MUST NOT be used in production deployments.

### Requirement: Least-Privilege IAM

The IAM role used for deployment SHALL follow least-privilege principles, granting only the permissions needed for CDK deploy: CloudFormation, Lambda, API Gateway, CloudWatch Logs, IAM PassRole, and S3 (CDK staging bucket).

### Requirement: Branch-Scoped Trust

The OIDC trust policy SHALL restrict role assumption to the `main` branch of the specific repository only.

### Requirement: Post-Deploy Smoke Test

The deploy workflow SHALL include a smoke test step that sends a minimal request to the deployed API and verifies a non-5xx response.

### Requirement: Monitoring and Alerting

The CDK stack SHALL include CloudWatch alarms for:

- API Gateway 5xx error rate
- Lambda invocation errors

### Requirement: Credential Safety

The Lambda handler MUST NOT log request bodies, credentials, or error messages that could contain credential information. A code comment SHALL warn against future logging of sensitive data.

### Requirement: Payload Size Limit

The Lambda handler SHALL reject request bodies larger than 512 KB with a 413 status code before parsing.

## Scenarios

#### Scenario: Push to main triggers deploy

- **GIVEN** a commit that modifies `packages/infra/src/stack/garmin-proxy-stack.ts`
- **WHEN** pushed to the `main` branch
- **THEN** the `deploy-infra.yml` workflow runs and deploys the stack via `cdk deploy`

#### Scenario: No deploy on feature branch

- **GIVEN** a commit that modifies `packages/infra/**`
- **WHEN** pushed to a feature branch
- **THEN** no deployment occurs (CI runs tests only)

#### Scenario: SPA uses env var for Lambda URL

- **GIVEN** the SPA is built with `VITE_GARMIN_LAMBDA_URL=https://xxxxx.execute-api.eu-west-1.amazonaws.com/push`
- **WHEN** the Garmin store initializes
- **THEN** the default Lambda URL is the provided API Gateway URL

#### Scenario: SPA without env var forces user config

- **GIVEN** the SPA is built without `VITE_GARMIN_LAMBDA_URL`
- **WHEN** the user opens settings
- **THEN** the Lambda URL field is empty and the user must provide their own URL

#### Scenario: Stale localStorage URL is migrated

- **GIVEN** the user has `https://api.kaiord.com/push` persisted in localStorage from a previous session
- **WHEN** the Garmin store hydrates
- **THEN** the persisted URL is treated as empty and the env var default (or empty) is used instead

#### Scenario: Manual workflow dispatch

- **GIVEN** the infra stack needs a forced redeploy
- **WHEN** a maintainer triggers `workflow_dispatch` on `deploy-infra.yml`
- **THEN** the stack is deployed to AWS regardless of file changes

#### Scenario: OIDC authentication

- **GIVEN** the deploy workflow runs on GitHub Actions
- **WHEN** it requests AWS credentials
- **THEN** it uses `aws-actions/configure-aws-credentials` with `role-to-assume` (no access keys)

#### Scenario: CORS blocks unauthorized origin

- **GIVEN** the Lambda is deployed with `allowedOrigins` set to the GitHub Pages URL
- **WHEN** a request arrives from a different origin
- **THEN** API Gateway rejects it with a CORS error

#### Scenario: Smoke test catches broken deploy

- **GIVEN** the CDK deploy completes successfully
- **WHEN** the smoke test step sends a POST with an empty body to `/push`
- **THEN** the API returns a 400 (bad request, not 5xx) confirming the Lambda is responsive

#### Scenario: Oversized payload rejected

- **GIVEN** a request with a body larger than 512 KB
- **WHEN** sent to the Lambda
- **THEN** the Lambda returns 413 without parsing the body

#### Scenario: Concurrent deploys are serialized

- **GIVEN** two pushes to main happen within seconds
- **WHEN** the first deploy is in progress
- **THEN** the second deploy waits (not cancelled) until the first completes
