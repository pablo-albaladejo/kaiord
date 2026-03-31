# @kaiord/infra

Self-hostable AWS CDK stack for the Kaiord Garmin Connect proxy.

## What it does

A stateless Lambda function that pushes workouts to Garmin Connect. It receives a KRD document and Garmin credentials, performs SSO login, converts KRD to GCN format, and pushes the workout. No data is persisted.

## Privacy

- **Stateless:** No credentials or workout data are stored
- **No database:** No DynamoDB, S3, or Secrets Manager
- **Never logged:** Request bodies and credentials are never logged. Only request IDs and error types appear in CloudWatch
- **Minimal logs:** CloudWatch logs with 1-week retention
- **Open source:** Audit the code yourself

## CI/CD Deployment (OIDC)

The stack deploys automatically via GitHub Actions when changes are pushed to `main`. Authentication uses OIDC federation (no stored AWS credentials).

### One-Time AWS Setup

1. **Create OIDC identity provider** in AWS IAM:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **Create IAM role** `github-actions-kaiord-deploy` with trust policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
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
     }]
   }
   ```

3. **Attach least-privilege policy** with permissions for: CloudFormation, Lambda, API Gateway, CloudWatch Logs, S3 (CDK staging bucket), IAM PassRole, CloudWatch Alarms.

4. **Bootstrap CDK** in the target account/region:
   ```bash
   aws configure  # set up your credentials
   cd packages/infra && npx cdk bootstrap
   ```

5. **Set GitHub repository variables** (Settings > Variables > Repository variables):
   - `AWS_ACCOUNT_ID` — Your AWS account ID
   - `AWS_REGION` — Target region (e.g., `eu-west-1`)
   - `AWS_DEPLOY_ROLE_ARN` — ARN of the IAM role created above
   - `SPA_ORIGIN` — GitHub Pages URL (e.g., `https://owner.github.io/kaiord`)

### Cross-Pipeline Coupling

After the first infra deploy:

1. Retrieve the API Gateway URL from the CDK output (shown in workflow logs or CloudFormation console)
2. Set GitHub variable `VITE_GARMIN_LAMBDA_URL` to `https://API_ID.execute-api.REGION.amazonaws.com/push`
3. Manually trigger the `Deploy Workout SPA Editor` workflow to rebuild with the new URL

If the stack is ever destroyed and recreated, the URL changes and steps 2-3 must be repeated.

## Manual Deploy

```bash
# From the monorepo root
pnpm install
pnpm --filter @kaiord/infra deploy
```

This creates:

- Lambda function (Node.js 24)
- API Gateway HTTP API with CORS enabled
- CloudWatch log group (1 week retention)
- CloudWatch alarms (5xx errors, Lambda errors)
- Default stage with rate limiting (10 req/s, burst 5)

## CORS Origins

By default, the API allows all origins (`*`). For production deployments, restrict CORS to your specific domain:

```bash
pnpm --filter @kaiord/infra cdk deploy \
  --context allowedOrigins='["https://your-spa-origin.com"]'
```

## Rate Limiting

The API includes default throttle settings on the `$default` stage:

- **Rate limit:** 10 requests per second (steady-state, global)
- **Burst limit:** 5 requests (maximum concurrent)

These limits are global, not per-IP. They protect against abuse while allowing normal usage patterns. To adjust, modify the `throttle` configuration in `garmin-proxy-stack.ts`.

## Expected Latency

Each push request takes **5-15 seconds** because the Lambda performs a full SSO login with Garmin Connect on every request. The Lambda timeout is set to 30 seconds.

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

- Maximum payload size: 512 KB
- Success: `200 { "id": "123", "name": "Workout", "url": "https://connect.garmin.com/modern/workout/123" }`
- Errors: `400` (invalid request), `401` (auth failed), `413` (payload too large), `500` (Garmin API error)

## Teardown

```bash
pnpm --filter @kaiord/infra cdk destroy
```
