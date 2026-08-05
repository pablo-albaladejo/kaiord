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

<!-- A vertical sequence, not a grid: the three steps have incomparable
     heights (one shell line, six lines of TS, one sentence), and a code
     line inside a minmax(260px, 1fr) cell sets the cell's min-content
     width far above 260px — on a 390px phone the grid overflows the
     page. Full-width code cannot overflow anything. -->

<h3 class="step-head"><span class="step-number">1</span> Install</h3>

```sh
pnpm add @kaiord/core @kaiord/fit @kaiord/tcx
```

<h3 class="step-head"><span class="step-number">2</span> Convert</h3>

```ts
import { fromBinary, toText } from "@kaiord/core";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";

const krd = await fromBinary(fitBuffer, fitReader);
const tcx = await toText(krd, tcxWriter);
```

<h3 class="step-head"><span class="step-number">3</span> Done</h3>

Your FIT file is now a valid TCX. Use it in any training platform that accepts TCX.

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

<!-- No <style> here on purpose. A <style> in a .md is global to the whole
     site with nothing marking it as such; the home's classes live in
     .vitepress/theme/custom.css, where global is what the file means. -->
