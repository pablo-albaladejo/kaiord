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
- Node.js 20+
- pnpm

## Deploy

```bash
# From the monorepo root
pnpm install
pnpm --filter @kaiord/infra deploy
```

This creates:
- Lambda function (Node.js 20)
- API Gateway HTTP API with CORS enabled
- CloudWatch log group (1 week retention)

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
