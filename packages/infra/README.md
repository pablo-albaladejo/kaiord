# @kaiord/infra

Self-hostable AWS CDK stack for the Kaiord Garmin Connect proxy.

## What it does

A stateless Lambda function that pushes workouts to Garmin Connect. It receives a KRD document and Garmin credentials, performs SSO login, converts KRD to GCN format, and pushes the workout. No data is persisted.

## Privacy

- **Stateless:** No credentials or workout data are stored
- **No database:** No DynamoDB, S3, or Secrets Manager
- **Minimal logs:** CloudWatch logs contain only request IDs and status codes
- **Open source:** Audit the code yourself

## Prerequisites

- AWS account with CLI configured (`aws configure`)
- Node.js 24+
- pnpm

## Deploy

```bash
# From the monorepo root
pnpm install
pnpm --filter @kaiord/infra deploy
```

This creates:

- Lambda function (Node.js 24)
- API Gateway HTTP API with CORS enabled
- CloudWatch log group (1 week retention)
- Default stage with rate limiting (10 req/s, burst 5)

## CORS Origins

By default, the API allows all origins (`*`). For production deployments, restrict CORS to your specific domain:

```bash
pnpm --filter @kaiord/infra cdk deploy \
  --context allowedOrigins='["https://editor.kaiord.com"]'
```

Multiple origins are supported:

```bash
pnpm --filter @kaiord/infra cdk deploy \
  --context allowedOrigins='["https://editor.kaiord.com","https://staging.kaiord.com"]'
```

## Rate Limiting

The API includes default throttle settings on the `$default` stage:

- **Rate limit:** 10 requests per second (steady-state)
- **Burst limit:** 5 requests (maximum concurrent)

These settings protect against abuse while allowing normal usage patterns. To adjust, modify the `throttle` configuration in `garmin-proxy-stack.ts`.

## API

```
POST /push
Content-Type: application/json

{
  "krd": { ... },
  "garmin": {
    "username": "your@email.com",
    "password": "your-password"
  }
}
```

Success: `200 { "id": "123", "name": "Workout", "url": "https://connect.garmin.com/modern/workout/123" }`

Errors:

- `400` — Invalid request body or KRD document
- `401` — Garmin authentication failed
- `500` — Garmin API error

## Teardown

```bash
pnpm --filter @kaiord/infra cdk destroy
```
