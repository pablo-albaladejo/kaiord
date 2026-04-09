---
title: "Why Kaiord?"
description: "Kaiord is a unified TypeScript SDK to convert FIT, TCX, ZWO, and Garmin Connect workout files. Stop juggling parsers -- one SDK, every format."
---

# Why Kaiord?

## The problem

Fitness data is fragmented. Garmin uses FIT (binary), TrainingPeaks uses TCX (XML), Zwift uses ZWO (XML), and Garmin Connect has its own JSON API. If you need to convert a FIT file to TCX in TypeScript, you are on your own -- there is no unified SDK.

Developers end up:

- Installing separate parsing libraries for each format
- Writing custom glue code to convert between them
- Losing data during conversions because formats have different capabilities
- Maintaining fragile pipelines that break when SDKs update

## Kaiord's approach

Kaiord defines **KRD** (Kaiord Representation Definition), a canonical JSON format that captures the superset of all supported formats. Every conversion goes through KRD:

```
FIT ──> KRD ──> TCX
ZWO ──> KRD ──> FIT
GCN ──> KRD ──> ZWO
```

This means:

- **One SDK** for reading and writing all formats
- **Round-trip safe** conversions with defined tolerances
- **Type-safe** -- every field is validated with Zod schemas
- **Extensible** -- add new formats without changing existing code

## How Kaiord compares

| Capability                | Individual parsers              | Kaiord                      |
| ------------------------- | ------------------------------- | --------------------------- |
| Read FIT files            | `@garmin/fitsdk`                | `@kaiord/fit`               |
| Read TCX files            | `fast-xml-parser` + custom code | `@kaiord/tcx`               |
| Read ZWO files            | Manual XML parsing              | `@kaiord/zwo`               |
| Garmin Connect API format | Custom JSON mapping             | `@kaiord/garmin`            |
| Convert between formats   | DIY glue code                   | `fromBinary` / `toText`     |
| Round-trip validation     | Not available                   | Built-in `validate` command |
| TypeScript types          | Partial or none                 | Full Zod schemas            |
| CLI tool                  | Build your own                  | `@kaiord/cli`               |
| AI/LLM integration        | Not available                   | `@kaiord/mcp`               |

## Who is Kaiord for?

- **Developers** building fitness apps that need to import/export workout files
- **Data engineers** processing Garmin, Zwift, or TrainingPeaks data pipelines
- **Coaches** who want to convert workout plans between platforms programmatically
- **AI builders** integrating fitness data into LLM workflows via MCP

## Search-friendly terms

If you searched for any of these, Kaiord is what you need:

- Convert FIT file to TCX in TypeScript
- Parse Garmin FIT files in Node.js
- Zwift workout file converter
- Garmin Connect workout API TypeScript
- FIT to JSON converter
- Fitness file format SDK

## Get started

```bash
pnpm add @kaiord/core @kaiord/fit @kaiord/tcx
```

Ready to convert? Follow the [Quick Start](/guide/quick-start).
