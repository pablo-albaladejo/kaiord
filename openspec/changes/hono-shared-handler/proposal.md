# Proposal: Extract shared Hono app from Lambda handler

## Problem

The Garmin push handler logic lives inside `packages/infra/src/lambda/handler.ts`, tightly coupled to the AWS Lambda event type (`APIGatewayProxyEventV2`). To test the push flow locally, developers must either deploy to AWS or write a separate server that duplicates the validation, error mapping, and routing logic. Any divergence between the two means local testing does not reflect production behavior.

## Solution

Extract the HTTP layer (request validation, routing, error mapping) into a shared **Hono** application (`app.ts`). Two thin entry points consume it:

- **`handler.ts`** (production): wraps the Hono app with `hono/aws-lambda` adapter, adds Tailscale proxy setup.
- **`dev-server.ts`** (local): wraps the same Hono app with `@hono/node-server`, adds CORS (configurable origin), binds to `127.0.0.1:3001`.

The core push logic (`garmin-push.ts`) remains unchanged. Local developers run `pnpm --filter @kaiord/infra dev:local` and point the SPA at `http://localhost:3001`.

## Affected Packages

| Package         | Impact                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| `@kaiord/infra` | Refactor handler into Hono app + two entry points; add `hono` dependency |

No other packages are touched. The SPA already supports `localhost` URLs in the Garmin settings panel.

## Breaking Changes

None. The Lambda handler export signature remains identical. The CDK stack does not change.

## Constraints

- Architecture layer: **adapters** (infra is an adapter package)
- Referenced specs: `openspec/specs/adapter-contracts/spec.md`
- File size limit: each new file MUST stay under 100 lines
- Hono is the only new production dependency (~14KB, zero transitive deps)
- `@hono/node-server` is a devDependency (not shipped in Lambda bundle)
