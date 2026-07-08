import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRunGenerateAgent = vi.fn();
const mockResolveModelForPurpose = vi.fn();
const mockCreateLanguageModel = vi.fn();

vi.mock("@kaiord/ai/agents", () => ({
  labExtractorAgent: { id: "lab-extractor" },
  runGenerateAgent: (...args: unknown[]) => mockRunGenerateAgent(...args),
}));

vi.mock("@kaiord/ai/providers", () => ({
  resolveModelForPurpose: (...args: unknown[]) =>
    mockResolveModelForPurpose(...args),
  createLanguageModel: (...args: unknown[]) => mockCreateLanguageModel(...args),
}));

import { labExtractorAgent } from "@kaiord/ai/agents";

import type { RunLabExtractionInput } from "./run-lab-extraction.use-case";
import { runLabExtraction } from "./run-lab-extraction.use-case";

const PDF_BYTES = new Uint8Array([1, 2]);
const GLUCOSE_VALUE = 92;
const PROVIDER = { id: "prov-1", type: "anthropic" };
const RESOLVED = { provider: PROVIDER, modelId: "model-1" };
const MODEL = { modelId: "test-model" };

const makeInput = (): RunLabExtractionInput => ({
  file: { data: PDF_BYTES, mediaType: "application/pdf", filename: "labs.pdf" },
  providers: [],
  bindings: [],
  locale: "en",
});

describe("runLabExtraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveModelForPurpose.mockReturnValue(RESOLVED);
    mockCreateLanguageModel.mockResolvedValue(MODEL);
    mockRunGenerateAgent.mockResolvedValue({
      output: {
        values: [
          { label: "GLU", parameterKey: "glucose", value: GLUCOSE_VALUE },
        ],
      },
    });
  });

  it("should resolve the lab_extraction model and return a mapped draft", async () => {
    // Arrange
    const input = makeInput();

    // Act
    const result = await runLabExtraction(input);

    // Assert
    expect(mockResolveModelForPurpose).toHaveBeenCalledWith(
      "lab_extraction",
      input.providers,
      input.bindings
    );
    expect(result).toMatchObject({
      ok: true,
      draft: { rows: [expect.objectContaining({ parameterKey: "glucose" })] },
    });
  });

  it("should build the language model in browser mode from the resolved pair", async () => {
    // Arrange
    const input = makeInput();

    // Act
    await runLabExtraction(input);

    // Assert
    expect(mockCreateLanguageModel).toHaveBeenCalledWith(PROVIDER, "model-1", {
      browser: true,
    });
  });

  it("should run the lab-extractor agent with the uploaded file and signal", async () => {
    // Arrange
    const controller = new AbortController();
    const input = { ...makeInput(), signal: controller.signal };

    // Act
    await runLabExtraction(input);

    // Assert
    expect(mockRunGenerateAgent).toHaveBeenCalledWith(
      labExtractorAgent,
      { files: [input.file] },
      { model: MODEL, signal: controller.signal }
    );
  });

  it("should return a no-provider result without calling the model", async () => {
    // Arrange
    mockResolveModelForPurpose.mockReturnValue(null);
    const input = makeInput();

    // Act
    const result = await runLabExtraction(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no_provider" });
    expect(mockCreateLanguageModel).not.toHaveBeenCalled();
    expect(mockRunGenerateAgent).not.toHaveBeenCalled();
  });

  it("should propagate a run failure as a rejection", async () => {
    // Arrange
    mockRunGenerateAgent.mockRejectedValue(new Error("model exploded"));
    const input = makeInput();

    // Act
    const run = runLabExtraction(input);

    // Assert
    await expect(run).rejects.toThrow("model exploded");
  });
});
