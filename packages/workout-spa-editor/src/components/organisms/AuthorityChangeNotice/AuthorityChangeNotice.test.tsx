import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { useDataFlows } from "../../../hooks/connections/use-data-flows";
import { useDataTypeRouting } from "../../../hooks/connections/use-data-type-routing";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { StaticLocaleProvider } from "../../../i18n/LocaleProvider";
import type { CapabilityId } from "../../../lib/capabilities/capability-catalogue";
import { renderWithProviders } from "../../../test-utils";
import type { DataTypeSourcePolicy } from "../../../types/data-type-source-policy";
import type { UserPreferences } from "../../../types/user-preferences";
import { AuthorityChangeNotice } from "./AuthorityChangeNotice";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000c7";
const NOW = "2026-11-23T08:00:00.000Z";

const ENGLISH =
  "Tanita now decides: Weight. Days only TrainingPeaks reported don't change.";
const SPANISH =
  "Tanita decide ahora: Peso. Los días que solo informó TrainingPeaks no cambian.";

const seed = async (seen: Record<string, string[]> | undefined) => {
  await db.table("profiles").put({
    id: PROFILE_ID,
    name: "Notice",
    linkedAccounts: [],
    sportZones: {},
    createdAt: NOW,
    updatedAt: NOW,
  });
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
  await db.table<UserPreferences>("userPreferences").put({
    profileId: PROFILE_ID,
    calendarView: "grid",
    authorityDeciders: seen,
    updatedAt: NOW,
  });
  for (const bridgeId of ["trainingpeaks-bridge", "tanita-bridge"]) {
    await db.table("integrationPolicies").put({
      id: `${bridgeId}-weight`,
      profileId: PROFILE_ID,
      dataType: "weight",
      bridgeId,
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: NOW,
    });
  }
};

/** What the Connections screen's weight row reads "From". */
const WeightRowFrom = () => {
  const { byDataType } = useDataFlows(PROFILE_ID);
  const { rows } = useDataTypeRouting(PROFILE_ID, byDataType);
  const origin = rows.find((r) => r.dataType === "weight")?.origin;
  const from = origin && "sourceId" in origin ? origin.sourceId : "none";
  return <output data-testid="weight-row-from">{from}</output>;
};

const remembered = async () =>
  (await db.table<UserPreferences>("userPreferences").get(PROFILE_ID))
    ?.authorityDeciders;

const renderNotice = (
  locale: "en" | "es" = "en",
  capabilities: CapabilityId[] = []
) =>
  renderWithProviders(
    <StaticLocaleProvider locale={locale}>
      <AuthorityChangeNotice />
    </StaticLocaleProvider>,
    { persistence: createDexiePersistence(db), capabilities }
  );

describe("AuthorityChangeNotice", () => {
  afterEach(async () => {
    await appI18n.changeLanguage("en");
  });

  beforeEach(async () => {
    for (const table of [
      "profiles",
      "meta",
      "userPreferences",
      "integrationPolicies",
      "dataTypeSourcePolicy",
      "connections",
    ]) {
      await db.table(table).clear();
    }
  });

  it("should say once that Tanita now decides the weight TrainingPeaks decided, with a link to its Connections row", async () => {
    // Arrange
    await seed({ weight: ["trainingpeaks"] });

    // Act
    renderNotice();

    // Assert
    expect(await screen.findByText(ENGLISH)).toBeInTheDocument();
    expect(screen.getByTestId("authority-notice-change")).toHaveAttribute(
      "href",
      "/connections?kind=weight"
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(async () =>
      expect(await remembered()).toEqual({
        weight: ["trainingpeaks", "tanita"],
      })
    );
  });

  it("should say it in Spanish", async () => {
    // Arrange
    await seed({ weight: ["trainingpeaks"] });
    await setActiveLocale("es");

    // Act
    renderNotice("es");

    // Assert
    expect(await screen.findByText(SPANISH)).toBeInTheDocument();
    expect(screen.getByTestId("authority-notice-change")).toHaveTextContent(
      "Cambiarlo"
    );
  });

  it("should link to the matrix while it is on", async () => {
    // Arrange
    await seed({ weight: ["trainingpeaks"] });

    // Act
    renderNotice("en", ["authority-matrix"]);

    // Assert
    expect(await screen.findByText(ENGLISH)).toBeInTheDocument();
    expect(screen.getByTestId("authority-notice-change")).toHaveAttribute(
      "href",
      "/settings/authority"
    );
  });

  it("should say nothing when another device already told the athlete", async () => {
    // Arrange
    await seed({ weight: ["trainingpeaks", "tanita"] });

    // Act
    renderNotice();

    // Assert
    await waitFor(async () =>
      expect(await remembered()).toEqual({
        weight: ["trainingpeaks", "tanita"],
      })
    );
    expect(screen.queryByText(ENGLISH)).not.toBeInTheDocument();
  });

  it("should say nothing and only remember when nothing decided weight before", async () => {
    // Arrange
    await seed(undefined);

    // Act
    renderNotice();

    // Assert
    await waitFor(async () =>
      expect(await remembered()).toEqual({ weight: ["tanita"] })
    );
    expect(screen.queryByText(ENGLISH)).not.toBeInTheDocument();
  });

  it("should say nothing when the athlete chose Tanita in the matrix", async () => {
    // Arrange
    await seed({ weight: ["trainingpeaks"] });
    await db.table<DataTypeSourcePolicy>("dataTypeSourcePolicy").put({
      profileId: PROFILE_ID,
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["tanita-bridge"],
    });

    // Act
    renderNotice("en", ["authority-matrix"]);

    // Assert
    await waitFor(async () =>
      expect(await remembered()).toEqual({
        weight: ["trainingpeaks", "tanita"],
      })
    );
    expect(screen.queryByText(ENGLISH)).not.toBeInTheDocument();
  });

  it("should name only the Platform the Connections screen shows deciding, a disconnected one that keeps its import route included", async () => {
    // Arrange
    await seed({ weight: ["trainingpeaks"] });
    await db.table("connections").put({
      profileId: PROFILE_ID,
      providerId: "tanita",
      status: "disconnected",
      mechanism: "bridge",
      updatedAt: NOW,
    });

    // Act
    renderWithProviders(
      <StaticLocaleProvider locale="en">
        <AuthorityChangeNotice />
        <WeightRowFrom />
      </StaticLocaleProvider>,
      { persistence: createDexiePersistence(db) }
    );

    // Assert
    expect(await screen.findByText(ENGLISH)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("weight-row-from")).toHaveTextContent("tanita")
    );
  });
});
