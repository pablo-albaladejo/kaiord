---
name: deploy-spa
description: Deploy workout SPA editor to GitHub Pages
disable-model-invocation: true
allowed-tools: Bash
---

Deploy the SPA editor to GitHub Pages.

## Prerequisites

Verify local build:
```bash
pnpm --filter @kaiord/core build
pnpm --filter @kaiord/workout-spa-editor build
```

## Manual Trigger

```bash
gh workflow run deploy-spa-editor.yml
```

## Check Status

```bash
gh run list --workflow=deploy-spa-editor.yml --limit 3
```

## Production URL

https://pablo-albaladejo.github.io/kaiord/

## Troubleshooting

If deploy fails:
1. Verify local build works
2. Review workflow logs in GitHub Actions
3. Check GitHub Pages permissions in Settings
