# Proposal: Deploy Garmin Proxy Lambda and Fix SPA Default URL

## Problem

The end-to-end flow (SPA → Lambda → Garmin Connect) does not work because:

1. The Lambda proxy has **never been deployed** — no `cdk.out/`, no AWS credentials configured, no CI/CD pipeline
2. The SPA hardcodes `https://api.kaiord.com/push` as default Lambda URL, which does not resolve to anything
3. There is no automated deployment pipeline for the infra package

Without a working Lambda proxy, the "Push to Garmin" button in the SPA is non-functional.

## Solution

1. **CI/CD pipeline**: Add a GitHub Actions workflow that deploys the Lambda via CDK using OIDC federation (no long-lived AWS credentials)
2. **SPA default URL**: Replace the hardcoded placeholder with the API Gateway auto-generated URL, injected via environment variable at build time
3. **CORS lockdown**: Deploy with explicit `allowedOrigins` matching the GitHub Pages SPA origin
4. **Monitoring**: Add CloudWatch alarms for error rate and Lambda failures
5. **Hygiene**: Add `cdk.out/` to `.gitignore`, document the setup process

## Affected Packages

| Package                      | Changes                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@kaiord/infra`              | Add `cdk.out` to gitignore, `CfnOutput` for API URL, CloudWatch alarms, CORS lockdown in deploy                |
| `@kaiord/workout-spa-editor` | Replace hardcoded URL with env var `VITE_GARMIN_LAMBDA_URL`, migrate stale localStorage URL, fallback to empty |
| `.github/workflows/`         | New `deploy-infra.yml` workflow with OIDC + CDK deploy + smoke test                                            |

## Breaking Changes

None. The hardcoded URL never worked, so changing the default is not a breaking change.

## Constraints

- Architecture layer(s): **adapters** (infra), **adapters** (SPA config)
- Referenced specs: `openspec/specs/adapter-contracts/spec.md` (API Adapter Pattern)
- AWS account must be set up manually as a one-time prerequisite (OIDC provider + IAM role)
- Infra deploy and SPA deploy are coupled: the API Gateway URL is only known after first infra deploy, then must be set as a GitHub variable and the SPA workflow re-triggered
