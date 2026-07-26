/**
 * Covers the AI import affordance end to end: successful extraction pre-fills
 * the form draft, a missing model disables the control, a run failure surfaces
 * a static toast, and discarding clears the draft. `runLabExtraction` and the
 * AI live hooks are mocked; text renders through the real i18n instance.
 */
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../../../../adapters/bridge/bridge-discovery";
import { readWhoopStatus } from "../../../../adapters/bridge/whoop-transport";
import { importWhoopLabs } from "../../../../application/whoop/import-whoop-labs.use-case";
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import { useDiscoveredBridges } from "../../../../hooks/use-discovered-bridges";
import { appI18n } from "../../../../i18n/i18n";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../test-utils";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import { LabEntryForm } from "./LabEntryForm";
import { LabImportSection } from "./LabImportSection";

const mockRunLabExtraction = vi.fn();
const mockMapExtractionToDraft = vi.fn();

vi.mock(
  "../../../../application/lab/extraction/run-lab-extraction.use-case",
  () => ({
    runLabExtraction: (...args: unknown[]) => mockRunLabExtraction(...args),
  })
);

vi.mock("./map-extraction-to-draft", () => ({
  mapExtractionToDraft: (...args: unknown[]) =>
    mockMapExtractionToDraft(...args),
}));

vi.mock("../../../../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../../../../adapters/bridge/whoop-transport", () => ({
  readWhoopStatus: vi.fn(),
  readWhoopFetch: vi.fn(),
}));
vi.mock("../../../../hooks/use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));
vi.mock("../../../../application/whoop/import-whoop-labs.use-case", () => ({
  importWhoopLabs: vi.fn(),
}));

const mockedGetExtensionId = vi.mocked(bridgeDiscovery.getExtensionId);
const mockedReadWhoopStatus = vi.mocked(readWhoopStatus);
const mockedUseDiscoveredBridges = vi.mocked(useDiscoveredBridges);
const mockedImportWhoopLabs = vi.mocked(importWhoopLabs);

const WHOOP_DISCOVERED: readonly DiscoveredBridge[] = [
  { bridgeId: "whoop-bridge", extensionId: "ext-1" },
];

let mockProviders: unknown[] = [];

vi.mock("../../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => mockProviders,
}));

vi.mock("../../../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: () => [],
}));

vi.mock("../../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    profile: { id: "p1", name: "Athlete", sex: "female", linkedAccounts: [] },
  }),
}));

const PDF_BYTES = new Uint8Array([1, 2]);
const PROVIDER = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  model: "claude-test",
  label: "Test",
  isDefault: true,
  createdAt: 0,
};

const EMPTY_DRAFT = {
  header: {
    date: "",
    labName: "",
    fasting: "unspecified",
    drawTime: "",
    notes: "",
  },
  rows: [],
};

const glucoseDraft = () => ({
  header: {
    date: "2026-03-05",
    labName: "",
    fasting: "unspecified",
    drawTime: "",
    notes: "",
  },
  rows: [
    {
      mode: "catalog",
      catalogLabel: "Glucose (fasting) (GLU)",
      customName: "",
      parameterKey: "glucose",
      valueRaw: "92",
      unitRaw: "mg/dL",
      refLowRaw: "",
      refHighRaw: "",
      refTouched: false,
    },
  ],
});

const pdfFile = () =>
  new File([PDF_BYTES], "labs.pdf", { type: "application/pdf" });

const AFFORDANCE = "Upload a PDF or image";
const RUN_FAILED = "Could not extract the lab report — please retry";
const NO_PROVIDER_HINT =
  "Configure a lab-extraction model in Settings to import from a file.";

const renderWithI18n = (
  ui: React.ReactElement,
  persistence = createInMemoryPersistence()
) =>
  renderWithProviders(<I18nextProvider i18n={appI18n}>{ui}</I18nextProvider>, {
    persistence,
  });

describe("LabImportSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProviders = [PROVIDER];
    mockRunLabExtraction.mockResolvedValue({
      ok: true,
      extraction: { values: [] },
    });
    mockMapExtractionToDraft.mockReturnValue(EMPTY_DRAFT);
    mockedUseDiscoveredBridges.mockReturnValue([]);
    mockedGetExtensionId.mockReturnValue(null);
  });

  it("should call onDraft with the mapped draft after a successful extraction", async () => {
    // Arrange
    const onDraft = vi.fn();
    renderWithI18n(<LabImportSection onDraft={onDraft} />);

    // Act
    await userEvent.upload(screen.getByLabelText(AFFORDANCE), pdfFile());

    // Assert
    await waitFor(() => expect(onDraft).toHaveBeenCalledWith(EMPTY_DRAFT));
  });

  it("should disable import and show a hint when no model is configured", () => {
    // Arrange
    mockProviders = [];

    // Act
    renderWithI18n(<LabImportSection onDraft={vi.fn()} />);

    // Assert
    expect(screen.queryByLabelText(AFFORDANCE)).toBeNull();
    expect(screen.getByText(NO_PROVIDER_HINT)).toBeInTheDocument();
  });

  it("should surface a static error toast when extraction fails", async () => {
    // Arrange
    mockRunLabExtraction.mockRejectedValue(new Error("boom"));
    renderWithI18n(<LabImportSection onDraft={vi.fn()} />);

    // Act
    await userEvent.upload(screen.getByLabelText(AFFORDANCE), pdfFile());

    // Assert
    await waitFor(() =>
      expect(screen.getByText(RUN_FAILED)).toBeInTheDocument()
    );
  });

  it("should show the review banner and discard it back to manual entry", async () => {
    // Arrange
    mockMapExtractionToDraft.mockReturnValue(glucoseDraft());
    renderWithI18n(<LabEntryForm />);
    await userEvent.upload(screen.getByLabelText(AFFORDANCE), pdfFile());
    await waitFor(() =>
      expect(screen.getByTestId("lab-ai-draft-banner")).toBeInTheDocument()
    );

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Discard draft" })
    );

    // Assert
    expect(screen.queryByTestId("lab-ai-draft-banner")).toBeNull();
  });

  it("should persist an extracted draft with ai-extracted provenance", async () => {
    // Arrange
    mockMapExtractionToDraft.mockReturnValue(glucoseDraft());
    const persistence = createInMemoryPersistence();
    renderWithI18n(<LabEntryForm />, persistence);
    await userEvent.upload(screen.getByLabelText(AFFORDANCE), pdfFile());
    await waitFor(() =>
      expect(screen.getByTestId("lab-ai-draft-banner")).toBeInTheDocument()
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    await waitFor(async () => {
      const reports = await persistence.labs.listReports("p1");
      expect(reports).toHaveLength(1);
    });
    const reports = await persistence.labs.listReports("p1");
    expect(reports[0].provenance).toEqual({ source: "ai-extracted" });
  });

  describe("WHOOP import", () => {
    it("should not render the WHOOP import button when the bridge is not discovered", () => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue([]);

      // Act
      renderWithI18n(<LabImportSection onDraft={vi.fn()} />);

      // Assert
      expect(
        screen.queryByRole("button", { name: "Import from WHOOP" })
      ).toBeNull();
    });

    it("should not render the WHOOP import button when discovered but not connected", async () => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
      mockedGetExtensionId.mockReturnValue("ext-1");
      mockedReadWhoopStatus.mockResolvedValue({
        connected: false,
        userId: null,
        capturedAt: null,
      });

      // Act
      renderWithI18n(<LabImportSection onDraft={vi.fn()} />);
      await waitFor(() => expect(mockedReadWhoopStatus).toHaveBeenCalled());

      // Assert
      expect(
        screen.queryByRole("button", { name: "Import from WHOOP" })
      ).toBeNull();
    });

    it("should run the import and toast the imported/skipped counts once connected", async () => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
      mockedGetExtensionId.mockReturnValue("ext-1");
      mockedReadWhoopStatus.mockResolvedValue({
        connected: true,
        userId: 42,
        capturedAt: 1,
      });
      mockedImportWhoopLabs.mockResolvedValue({
        ok: true,
        imported: 2,
        skipped: 1,
      });
      renderWithI18n(<LabImportSection onDraft={vi.fn()} />);
      const button = await screen.findByRole("button", {
        name: "Import from WHOOP",
      });

      // Act
      await userEvent.click(button);

      // Assert
      await waitFor(() =>
        expect(screen.getByText("Imported 2, skipped 1")).toBeInTheDocument()
      );
      expect(mockedImportWhoopLabs).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: "p1" })
      );
    });

    it("should toast a static failure message when the import reports ok:false", async () => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
      mockedGetExtensionId.mockReturnValue("ext-1");
      mockedReadWhoopStatus.mockResolvedValue({
        connected: true,
        userId: 42,
        capturedAt: 1,
      });
      mockedImportWhoopLabs.mockResolvedValue({
        ok: false,
        reason: "transport-error",
      });
      renderWithI18n(<LabImportSection onDraft={vi.fn()} />);
      const button = await screen.findByRole("button", {
        name: "Import from WHOOP",
      });

      // Act
      await userEvent.click(button);

      // Assert
      await waitFor(() =>
        expect(
          screen.getByText("Could not import WHOOP lab results — please retry")
        ).toBeInTheDocument()
      );
    });
  });
});
