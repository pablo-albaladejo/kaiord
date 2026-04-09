---
layout: home
title: "Kaiord Documentation"
description: "Open-source health & fitness data framework for TypeScript. Convert FIT, TCX, ZWO, and GCN formats with one unified API."
---

<script setup>
import { VPHomeHero, VPHomeFeatures } from 'vitepress/theme'
</script>

# One framework. Every fitness format.

Kaiord is an open-source TypeScript framework for reading, writing, and converting health and fitness data across FIT, TCX, ZWO, and Garmin Connect formats.

<div class="hero-actions">
  <a class="action-btn primary" href="/docs/guide/quick-start">Quick Start</a>
  <a class="action-btn secondary" href="https://github.com/pablo-albaladejo/kaiord">GitHub</a>
</div>

## Get started in 3 steps

<div class="steps-grid">
  <div class="step">
    <div class="step-number">1</div>
    <h3>Install</h3>

```sh
pnpm add @kaiord/core @kaiord/fit @kaiord/tcx
```

  </div>
  <div class="step">
    <div class="step-number">2</div>
    <h3>Convert</h3>

```ts
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";

const krd = await fromBinary(fitBuffer, fitReader);
const tcx = await toText(krd, tcxWriter);
```

  </div>
  <div class="step">
    <div class="step-number">3</div>
    <h3>Done</h3>
    <p>Your FIT file is now a valid TCX. Use it in any training platform that accepts TCX.</p>
  </div>
</div>

## Explore

<div class="features-grid">
  <a class="feature-card" href="/docs/formats/krd">
    <h3>Formats</h3>
    <p>KRD, FIT, TCX, ZWO, and Garmin Connect format adapters</p>
  </a>
  <a class="feature-card" href="/docs/cli/commands">
    <h3>CLI</h3>
    <p>Convert, validate, inspect, and diff files from the command line</p>
  </a>
  <a class="feature-card" href="/docs/mcp/tools">
    <h3>MCP Server</h3>
    <p>AI/LLM integration via the Model Context Protocol</p>
  </a>
  <a class="feature-card" href="/docs/api/">
    <h3>API Reference</h3>
    <p>Auto-generated TypeScript API documentation</p>
  </a>
</div>

<style>
.hero-actions {
  display: flex;
  gap: 12px;
  margin: 24px 0 48px;
}

.action-btn {
  display: inline-block;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.85;
}

.action-btn.primary {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.action-btn.secondary {
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin: 24px 0 48px;
}

.step {
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 8px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.feature-card {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: var(--vp-c-brand-1);
}

.feature-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.feature-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
</style>
