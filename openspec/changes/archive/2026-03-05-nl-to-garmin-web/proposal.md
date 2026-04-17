> Completed: 2026-03-05

# Proposal: Natural Language Workout to Garmin Connect (Web)

## Problem

Users currently need the CLI to generate workouts from natural language and push them to Garmin Connect. There is no web-based flow. The SPA has no AI integration and no Garmin Connect connectivity. Users who want a simple "describe my workout → it's on my Garmin watch" experience must install Node.js, use the terminal, and manage CLI credentials.

## Solution

Add a web-based flow where users:

1. Type a workout in natural language (any language)
2. Optionally add a custom prompt to guide generation (e.g., "I'm recovering from a knee injury")
3. The LLM generates a structured workout using the user's training zones
4. The workout is pushed to Garmin Connect via a stateless Lambda proxy

The architecture splits into two concerns:

- **Browser-side (frontend):** LLM call to user's chosen provider (Anthropic/OpenAI/Google — all CORS-allowed direct from browser), workout preview/editing, multi-provider configuration, credential management (encrypted localStorage)
- **Server-side (Lambda):** Receives KRD + Garmin credentials, performs SSO login, converts KRD → GCN, pushes to Garmin Connect. Stateless — no data persisted.

A self-hostable `@kaiord/infra` CDK package allows any user to deploy their own Lambda stack if they don't trust the hosted version.

## Affected Packages

| Package                      | Change                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@kaiord/workout-spa-editor` | New AI input UI, Garmin push UI, settings panel (API key, Garmin creds, zones), encrypted storage                                     |
| `@kaiord/infra` (NEW)        | AWS CDK stack: Lambda function + API Gateway for Garmin proxy                                                                         |
| `@kaiord/ai`                 | No code changes — used as-is from the browser via `createTextToWorkout()`. Provider-agnostic design supports all three LLM providers. |
| `@kaiord/garmin-connect`     | No code changes — used inside the Lambda                                                                                              |
| `@kaiord/garmin`             | No code changes — used inside the Lambda for KRD → GCN conversion                                                                     |
| `@kaiord/core`               | No code changes — used in both browser and Lambda                                                                                     |

## Breaking Changes

None. This is additive — new UI features in the SPA and a new package. No existing APIs are modified.

## Constraints

- Architecture layers: adapters (SPA UI, Lambda handler), application (orchestration)
- Referenced specs: `openspec/specs/adapter-contracts/spec.md`, `openspec/specs/krd-format/spec.md`
- LLM APIs called directly from browser — Anthropic, OpenAI, and Google Gemini all allow CORS
- Garmin API blocked by CORS — requires server proxy (Lambda)
- All credentials stored in browser localStorage, encrypted with Web Crypto API
- Lambda is stateless: no logs of credentials, no persistence, no analytics
- `@kaiord/infra` is a self-contained CDK package — `cdk deploy` creates everything
- Code is opensource — users can audit and self-host
- Clear disclaimers: we don't store credentials, we're not responsible for them
