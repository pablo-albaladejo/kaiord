/**
 * Covers the AI import affordance end to end: successful extraction pre-fills
 * the form draft, a missing model disables the control, a run failure surfaces
 * a static toast, and discarding clears the draft. `runLabExtraction` and the
 * AI live hooks are mocked; text renders through the real i18n instance.
 */
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock(
  "../../../../application/lab/extraction/run-lab-extraction.use-case",
  () => ({
    runLabExtraction: (...args: unknown[]) => mockRunLabExtraction(...args),
  })
);

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
    mockRunLabExtraction.mockResolvedValue({ ok: true, draft: EMPTY_DRAFT });
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
    mockRunLabExtraction.mockResolvedValue({ ok: true, draft: glucoseDraft() });
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
    mockRunLabExtraction.mockResolvedValue({ ok: true, draft: glucoseDraft() });
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
});
