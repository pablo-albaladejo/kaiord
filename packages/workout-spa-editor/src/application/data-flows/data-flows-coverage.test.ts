/**
 * The inventory is the list in `data-flows.ts`; this guard fails when the
 * code sends data some way that list does not declare.
 *
 * - Every source file that calls an outbound primitive is declared here
 *   against the flows it carries, and every flow has such a file.
 * - Every remote origin of the App's content security policy (the complete
 *   list of what a page may reach) belongs to one destination, and back.
 * - Every write an extension declares and the App serves is a flow to that
 *   Platform, and every extension is a destination.
 * - Every chat tool is classified as reading health or not.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { buildChatTools } from "../chat/tools/build-chat-tools";
import {
  HEALTH_READING_TOOLS,
  NO_HEALTH_TOOLS,
} from "../chat/tools/health-reading-tools";
import { EXTENSIONS } from "../connections/extension-descriptors";
import { DATA_FLOW_IDS, DATA_FLOWS, type DataFlowId } from "./data-flows";
import type { DataKind } from "./data-kinds";
import { DESTINATION_IDS, DESTINATIONS } from "./destinations";

const SRC = resolve(__dirname, "../..");
const REPO = resolve(SRC, "../../..");

const OUTBOUND =
  /createLanguageModel\(|verifyProviderKey|(^|[^.\w])fetch\(|= fetch\b|chrome\.runtime\.(sendMessage|connect)\(|\.track\(|accounts\.google\.com|new (WebSocket|EventSource|XMLHttpRequest)\b|sendBeacon\(/m;
const NOT_SHIPPED =
  /\.(test|stories)\.tsx?$|\.d\.ts$|(^|\/)(test-utils|test-fixtures|__perf__|__regressions__)\//;

const FLOW_SITES: Record<string, readonly DataFlowId[]> = {
  "hooks/chat/build-chat-agent.ts": ["assistant"],
  "lib/generate-workout.ts": ["generation"],
  "application/lab/extraction/run-lab-extraction.use-case.ts": ["labImport"],
  "components/organisms/SettingsPanel/save-with-key-check.ts": [
    "providerKeyCheck",
  ],
  "adapters/bridge/bridge-transport.ts": [
    "garminWorkouts",
    "garminBody",
    "trainingpeaksWorkouts",
    "platformReads",
  ],
  "adapters/connections/intervals-icu-validate.ts": ["intervalsKeyCheck"],
  "adapters/cloud-sync/drive-authed-fetch.ts": ["driveSync"],
  "lib/cloud-sync/google-oauth-config.ts": ["driveSync"],
  "adapters/analytics/umami-analytics.ts": ["analytics"],
};

/** The kind of data each exported managed data type is, for a Platform. */
const EXPORT_KIND: Partial<Record<string, DataKind>> = {
  workout: "workouts",
  "body-composition": "bodyComposition",
};

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.tsx?$/.test(entry.name) ? [relative(SRC, path)] : [];
  });

const outboundFiles = () =>
  walk(SRC).filter(
    (file) =>
      !NOT_SHIPPED.test(file) &&
      !file.startsWith("application/data-flows/") &&
      OUTBOUND.test(readFileSync(join(SRC, file), "utf8"))
  );

const extensionWrites = (extension: string): string[] => {
  const identity = readFileSync(
    join(REPO, "packages", extension, "bridge-identity.js"),
    "utf8"
  );
  const list = /capabilities:\s*\[([^\]]*)\]/.exec(identity)?.[1] ?? "";
  return [...list.matchAll(/"(write:[^"]+)"/g)].map((m) => m[1]);
};

const flowsCarrying = (destination: string, kind: DataKind) =>
  DATA_FLOW_IDS.filter(
    (id) =>
      (DATA_FLOWS[id].to as readonly string[]).includes(destination) &&
      (DATA_FLOWS[id].kinds as readonly DataKind[]).includes(kind)
  );

describe("data-flows coverage", () => {
  it("should declare every file that sends data off the device against its flows", () => {
    // Arrange
    const declared = new Set(Object.keys(FLOW_SITES));

    // Act
    const found = outboundFiles();
    const undeclared = found.filter((file) => !declared.has(file));
    const stale = [...declared].filter((file) => !found.includes(file));

    // Assert
    expect(found.length).toBeGreaterThan(0);
    expect(undeclared).toEqual([]);
    expect(stale).toEqual([]);
  });

  it("should carry every flow in the registry by some declared file, and no other", () => {
    // Arrange
    const sited = new Set(Object.values(FLOW_SITES).flat());

    // Act
    const unsited = DATA_FLOW_IDS.filter((id) => !sited.has(id));
    const unknown = [...sited].filter((id) => !(id in DATA_FLOWS));

    // Assert
    expect(unsited).toEqual([]);
    expect(unknown).toEqual([]);
  });

  it("should give every remote origin of the App's policy to one destination, and back", async () => {
    // Arrange
    const policyUrl = pathToFileURL(
      join(REPO, "scripts/lib/site-csp-policy.mjs")
    ).href;
    const { SITE_CSP } = (await import(/* @vite-ignore */ policyUrl)) as {
      SITE_CSP: { app: Record<string, string[]> };
    };
    const allowed = new Set(
      Object.values(SITE_CSP.app)
        .flat()
        .filter((source) => source.startsWith("https://"))
        .map((source) => new URL(source).origin)
    );
    const owned = DESTINATION_IDS.flatMap((id) => {
      const d = DESTINATIONS[id];
      return "origins" in d ? d.origins.map((origin) => ({ id, origin })) : [];
    });

    // Act
    const ownerless = [...allowed].filter(
      (origin) => !owned.some((o) => o.origin === origin)
    );
    const notAllowed = owned.filter((o) => !allowed.has(o.origin));
    const twice = owned.filter(
      (o, i) => owned.findIndex((p) => p.origin === o.origin) !== i
    );

    // Assert
    expect(ownerless).toEqual([]);
    expect(notAllowed).toEqual([]);
    expect(twice).toEqual([]);
  });

  it("should make every extension a destination and every write it serves a flow", () => {
    // Arrange
    const platforms = DESTINATION_IDS.flatMap((id) => {
      const d = DESTINATIONS[id];
      return d.group === "platform" ? [{ id, extension: d.extension }] : [];
    });

    // Act
    const missing = Object.keys(EXTENSIONS).filter(
      (ext) => !platforms.some((p) => p.extension === ext)
    );
    const unflowed = platforms.flatMap(({ id, extension }) =>
      managedDataTypes
        .filter((type) => {
          const token = MANAGED_DATA_REGISTRY[type].capabilities.export;
          return (
            token !== undefined &&
            extensionWrites(extension).includes(token) &&
            bridgeSupportsRoute(extension, type, "export")
          );
        })
        .filter((type) => {
          const kind = EXPORT_KIND[type];
          return kind === undefined || flowsCarrying(id, kind).length === 0;
        })
        .map((type) => `${type} to ${id}`)
    );
    const unread = platforms.filter(
      ({ id }) => flowsCarrying(id, "readRequests").length === 0
    );

    // Assert
    expect(missing).toEqual([]);
    expect(unflowed).toEqual([]);
    expect(unread).toEqual([]);
  });

  it("should classify every chat tool as reading health or not", () => {
    // Arrange
    const tools = buildChatTools({
      persistence: {} as never,
      profileId: "p",
      today: "2026-11-23",
      actions: {} as never,
      getMatrixSignals: async () => ({}) as never,
    }).map((tool) => tool.name);

    // Act
    const unclassified = tools.filter(
      (name) => !HEALTH_READING_TOOLS.has(name) && !(name in NO_HEALTH_TOOLS)
    );
    const both = tools.filter(
      (name) => HEALTH_READING_TOOLS.has(name) && name in NO_HEALTH_TOOLS
    );
    const gone = [
      ...HEALTH_READING_TOOLS,
      ...Object.keys(NO_HEALTH_TOOLS),
    ].filter((name) => !tools.includes(name));

    // Assert
    expect(unclassified).toEqual([]);
    expect(both).toEqual([]);
    expect(gone).toEqual([]);
  });

  it("should name every destination in the privacy policy, and every one but the Platforms in the landing's data statement", () => {
    // Arrange
    const policy = readFileSync(
      join(REPO, "packages/docs/legal/privacy-policy.md"),
      "utf8"
    );
    const landing = readFileSync(
      join(REPO, "packages/landing/index.html"),
      "utf8"
    ).replace(/\s+/g, " ");
    const statement =
      /Your training and health data lives in IndexedDB[^<]*/.exec(
        landing
      )?.[0] ?? "";

    // Act
    const notInPolicy = DESTINATION_IDS.filter(
      (id) => !policy.includes(DESTINATIONS[id].name)
    );
    const notInLanding = DESTINATION_IDS.filter(
      (id) =>
        DESTINATIONS[id].group !== "platform" &&
        !statement.includes(DESTINATIONS[id].name)
    );

    // Assert
    expect(statement).toContain(
      "platforms you connect through their extensions"
    );
    expect(notInPolicy).toEqual([]);
    expect(notInLanding).toEqual([]);
  });
});
