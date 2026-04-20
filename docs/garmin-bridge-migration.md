# Garmin Bridge Migration Guide

## Overview

The Garmin Connect integration has been migrated from a self-hosted AWS Lambda proxy (`@kaiord/infra`) to a browser extension (`@kaiord/garmin-bridge`).

## Tearing Down the AWS Infrastructure

If you previously deployed the CDK stack, follow these steps to clean up:

### 1. Destroy the CDK stack

```bash
cd packages/infra
npx cdk destroy --all
```

Confirm the destruction when prompted. This removes:

- API Gateway
- Lambda function
- CloudWatch alarms
- Associated IAM roles

### 2. Manual cleanup checklist

- [ ] Verify API Gateway is removed in AWS Console
- [ ] Remove any CloudWatch log groups under `/aws/lambda/garmin-proxy-*`
- [ ] If using Tailscale: remove the exit node configuration
- [ ] Remove any AWS environment variables or secrets from GitHub repository settings:
  - `AWS_DEPLOY_ROLE_ARN`
  - `TS_EXIT_NODE`
  - `SPA_ORIGIN`

### 3. Verify

- Confirm the API Gateway URL no longer responds
- Confirm no Lambda functions remain with "garmin" in the name

## Setting Up the Extension

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select `packages/garmin-bridge/`
4. Open Garmin Connect in a tab and navigate around
5. The SPA will detect the extension automatically

## SPA Changes

- The `VITE_GARMIN_LAMBDA_URL` environment variable has been removed
- Garmin credentials (username/password) are no longer stored
- The Settings panel now shows extension status instead of Lambda URL and credentials
- Extension IDs are discovered at runtime via a content script announcement; no
  `VITE_GARMIN_EXTENSION_ID` env var is required
