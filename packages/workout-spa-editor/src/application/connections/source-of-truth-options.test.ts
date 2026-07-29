import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { buildDataTypeRoutingRows } from "./data-type-routing";
import { availableSources } from "./data-type-sources";
import {
  buildSourceOfTruthOptions,
  canChooseSource,
  promoteSource,
  type SourceCapabilitySignals,
} from "./source-of-truth-options";

const route = (bridgeId: string, enabled = true): IntegrationPolicy =>
  ({ bridgeId, enabled }) as IntegrationPolicy;

const flows = (
  entries: Partial<Record<ManagedDataType, { import?: IntegrationPolicy[] }>>
): DataFlowsByType =>
  new Map(
    Object.entries(entries).map(([dataType, value]) => [
      dataType as ManagedDataType,
      { import: value?.import ?? [], export: [] },
    ])
  );

const priority = (
  dataType: ManagedDataType,
  sourceOrder: string[]
): DataTypeSourcePolicy =>
  ({ dataType, mode: "priority", sourceOrder }) as DataTypeSourcePolicy;

/** Every bridge announces everything, and nothing narrows a shared token —
    the neutral baseline against which a capability refusal is visible. */
const PERMISSIVE: SourceCapabilitySignals = {
  capabilitiesFor: () => null,
  supportsRoute: () => true,
};

const signals = (
  announced: Record<string, readonly string[]>
): SourceCapabilitySignals => ({
  capabilitiesFor: (bridgeId) => announced[bridgeId] ?? null,
  supportsRoute: () => true,
});

const optionsFor = (
  dataType: ManagedDataType,
  byDataType: DataFlowsByType,
  policy?: DataTypeSourcePolicy,
  caps: SourceCapabilitySignals = PERMISSIVE
) =>
  buildSourceOfTruthOptions(
    dataType,
    availableSources(byDataType, dataType),
    policy,
    caps
  );

describe("buildSourceOfTruthOptions", () => {
  it("should offer every source the row already reads from, manual included", () => {
    // Arrange
    // WHOOP is the only bridge announcing `read:sleep`; the Data Hub
    // sleep/WHOOP import cell is the writer that enables it. Manual entry is a
    // source for sleep by product decision, and the resolver exempts it from
    // the enabled filter, so it must be pickable too.
    const byDataType = flows({ sleep: { import: [route("whoop-bridge")] } });

    // Act
    const options = optionsFor("sleep", byDataType);

    // Assert
    expect(options.choices).toEqual(["whoop-bridge", "manual"]);
    expect(options.mode).toBe("union");
    expect(options.current).toBeUndefined();
  });

  it("should not offer a source whose bridge cannot serve the type", () => {
    // Arrange
    // Writer: chat `enable_route stress garmin import`, the one writer with NO
    // capability check (issue #1085). It mints an enabled import policy the
    // Data Hub itself renders `na`, because Garmin announces write:workouts,
    // read:activities and write:body — never `read:body` for stress.
    const byDataType = flows({ stress: { import: [route("garmin-bridge")] } });
    const garmin = signals({
      "garmin-bridge": ["write:workouts", "read:activities", "write:body"],
    });

    // Act
    const options = optionsFor("stress", byDataType, undefined, garmin);

    // Assert
    expect(options.choices).toEqual(["manual"]);
  });

  it("should keep offering a source whose extension has not been verified", () => {
    // Arrange
    // Writer: the Data Hub sleep/WHOOP cell toggle, run while the extension
    // was present. On a later load — extension uninstalled, or discovery not
    // finished — `getCapabilities` is null. WHOOP's stored sleep records are
    // still what the resolver reads, so dropping it would take a real source
    // off the list for a reason that is only "we have not asked yet".
    const byDataType = flows({ sleep: { import: [route("whoop-bridge")] } });
    const unverified = signals({});

    // Act
    const options = optionsFor("sleep", byDataType, undefined, unverified);

    // Assert
    expect(options.choices).toContain("whoop-bridge");
  });

  it("should not offer an import route the user switched off", () => {
    // Arrange
    // Toggling the Data Hub's weight/WHOOP cell off writes enabled:false
    // rather than deleting the row, so a disabled route stays visible to this
    // derivation and must be filtered rather than offered.
    const byDataType = flows({
      weight: { import: [route("whoop-bridge", false)] },
    });

    // Act
    const options = optionsFor("weight", byDataType);

    // Assert
    expect(options.choices).toEqual(["manual"]);
  });

  it("should name the ranked head as current, never an appended source", () => {
    // Arrange
    // Writer: the Data Hub priority editor storing ["tanita-bridge"] for
    // weight, after which the WHOOP weight import is switched on and never
    // ranked. `orderSources` would append WHOOP; only Tanita is ranked, and
    // only Tanita is what `resolveEffectiveSource` consults first.
    const byDataType = flows({
      weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
    });

    // Act
    const options = optionsFor(
      "weight",
      byDataType,
      priority("weight", ["tanita-bridge"])
    );

    // Assert
    expect(options.current).toBe("tanita-bridge");
    expect(options.choices).toEqual([
      "tanita-bridge",
      "whoop-bridge",
      "manual",
    ]);
  });

  it("should report no current source when the stored order ranks nothing available", () => {
    // Arrange
    // Writer: chat `set_source_policy stress priority ["garmin"]` — it
    // resolves, so no writer guard stops it — while a Garmin stress import can
    // never be enabled. The panel must not mark any choice as the one in use.
    // Act
    const options = optionsFor(
      "stress",
      flows({}),
      priority("stress", ["garmin-bridge"])
    );

    // Assert
    expect(options.mode).toBe("priority");
    expect(options.current).toBeUndefined();
    expect(options.choices).toEqual(["manual"]);
  });
});

describe("canChooseSource", () => {
  it("should offer no choice on a lone source under the default mode", () => {
    // Arrange
    // The state of a profile that has linked nothing: stress has manual entry
    // and nothing else. There is no second way to read it, so a control that
    // only ever flipped the mode would be a semantic change with no benefit.
    // Act
    const options = optionsFor("stress", flows({}));

    // Assert
    expect(options.choices).toEqual(["manual"]);
    expect(canChooseSource(options)).toBe(false);
  });

  it("should keep the way back reachable once a ranking is stored", () => {
    // Arrange
    // Writer: this control, or the Data Hub priority editor, ranking weight
    // while two sources existed; the user then switched the WHOOP weight
    // import off. Reversibility must not depend on the second source still
    // being there.
    const byDataType = flows({ weight: { import: [route("tanita-bridge")] } });

    // Act
    const options = optionsFor(
      "weight",
      byDataType,
      priority("weight", ["tanita-bridge"])
    );

    // Assert
    expect(canChooseSource(options)).toBe(true);
  });

  it("should offer no choice on a ranked row that has no source left at all", () => {
    // Arrange
    // Writers, in order: chat `set_source_policy planned-session priority
    // ["train2go"]`, then Disconnect on the Train2Go card, which switches off
    // every policy on the bridge. `planned-session` has no manual path, so
    // nothing remains. Both modes read nothing here, and the row already says
    // "No source" — a panel could only describe a ranking problem it does not
    // have.
    // Act
    const options = optionsFor(
      "planned-session",
      flows({
        "planned-session": { import: [route("train2go-bridge", false)] },
      }),
      priority("planned-session", ["train2go-bridge"])
    );

    // Assert
    expect(options.choices).toEqual([]);
    expect(canChooseSource(options)).toBe(false);
  });
});

describe("promoteSource", () => {
  it("should put the picked source first and keep the others behind it", () => {
    // Arrange
    // Writer: two Data Hub weight import cells (WHOOP and Tanita both announce
    // read:body and both serve weight). Nothing is ranked yet, so this is the
    // very first ranking the control writes.
    const byDataType = flows({
      weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
    });
    const options = optionsFor("weight", byDataType);

    // Act
    const order = promoteSource(options, "tanita-bridge");

    // Assert
    expect(order).toEqual(["tanita-bridge", "whoop-bridge", "manual"]);
  });

  it("should keep the previous ranking behind a newly picked source", () => {
    // Arrange
    // Writer: this control, having already ranked Tanita first. Re-picking
    // must reorder rather than discard what was there, so the fallbacks the
    // user chose survive.
    const byDataType = flows({
      weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
    });
    const options = optionsFor(
      "weight",
      byDataType,
      priority("weight", ["tanita-bridge", "whoop-bridge"])
    );

    // Act
    const order = promoteSource(options, "manual");

    // Assert
    expect(order).toEqual(["manual", "tanita-bridge", "whoop-bridge"]);
  });

  it("should write an order the row's own reader resolves to the picked source", () => {
    // Arrange
    // The writer/reader agreement, end to end: what this control stores is fed
    // straight back into the Wave 2a derivation that draws the pill. A head
    // the reader would skip — the shipped bug `orderSources` reintroduces —
    // shows up here as `rankedUnavailable` or as the wrong name.
    const byDataType = flows({
      weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
    });
    const options = optionsFor("weight", byDataType);

    // Act
    // Tanita is deliberately NOT the first candidate: a writer that stored the
    // candidate order untouched would still look right if the pick led it.
    const stored = priority("weight", promoteSource(options, "tanita-bridge"));
    const row = buildDataTypeRoutingRows(byDataType, [stored]).find(
      (candidate) => candidate.dataType === "weight"
    );

    // Assert
    expect(row?.origin).toEqual({
      kind: "primary",
      sourceId: "tanita",
      count: 3,
    });
  });
});
