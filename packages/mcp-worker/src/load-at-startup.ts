// Must be the entry's first import. The tool registry loads the format
// adapters with `await import()`, so esbuild wraps them, and zod with them,
// in lazy initializers. Two consequences in workerd:
//
// - The MCP SDK reaches zod through `import * as z from "zod/v4"`, which only
//   re-exports zod and gets no initializer call from esbuild, so without the
//   zod import below the SDK's top-level schemas meet an uninitialized zod and
//   the bundle fails at load with "Class2 is not a constructor".
// - An adapter first initialized inside a request (the FIT SDK's profile
//   tables above all) spends that request's 10 ms CPU budget and fails it
//   with error 1102. Initialized here, it is paid once at isolate startup.
import { createFitReader } from "@kaiord/fit";
import { createGarminReader } from "@kaiord/garmin";
import { createTcxReader } from "@kaiord/tcx";
import { createZwiftReader } from "@kaiord/zwo";
import { z } from "zod";

/** @public Referenced so the bundler keeps every import above. */
export const LOADED_AT_STARTUP = [
  z.object,
  createFitReader,
  createGarminReader,
  createTcxReader,
  createZwiftReader,
] as const;
