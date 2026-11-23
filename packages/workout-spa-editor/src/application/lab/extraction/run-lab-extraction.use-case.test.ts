import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRunGenerateAgent = vi.fn();
const mockResolveModelForPurpose = vi.fn();
const mockCreateLanguageModel = vi.fn();

vi.mock("@kaiord/ai/agents", () => ({
  labExtractorAgent: { id: "lab-extractor" },
  runGenerateAgent: (...args: unknown[]) => mockRunGenerateAgent(...args),
}));

vi.mock("@kaiord/ai/providers", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  resolveModelForPurpose: (...args: unknown[]) =>
    mockResolveModelForPurpose(...args),
  createLanguageModel: (...args: unknown[]) => mockCreateLanguageModel(...args),
}));

import { labExtractorAgent } from "@kaiord/ai/agents";

import { createInMemoryTraceRepository } from "../../../test-utils/in-memory-trace-repository";
import { startTraceRun } from "../../trace/trace-run";
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
  askHealth: async () => "send",
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

  it("should resolve the lab_extraction model and return the raw extraction", async () => {
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
      extraction: {
        values: [expect.objectContaining({ parameterKey: "glucose" })],
      },
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

  it("should ask before the document goes, naming its Provider", async () => {
    // Arrange
    const askHealth = vi.fn(async () => "send" as const);

    // Act
    await runLabExtraction({ ...makeInput(), askHealth });

    // Assert
    expect(askHealth).toHaveBeenCalledWith("anthropic");
    expect(mockRunGenerateAgent).toHaveBeenCalled();
  });

  it("should not send the document when the athlete does not share health data", async () => {
    // Arrange
    const input = {
      ...makeInput(),
      askHealth: async () => "withhold" as const,
    };

    // Act
    const result = await runLabExtraction(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "withheld" });
    expect(mockCreateLanguageModel).not.toHaveBeenCalled();
    expect(mockRunGenerateAgent).not.toHaveBeenCalled();
  });

  it("should leave one Trace naming the lab results sent to the Provider", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    const trace = startTraceRun({ feature: "lab_import", traces });

    // Act
    await runLabExtraction({ ...makeInput(), trace });
    const stored = await traces.list();

    // Assert
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      feature: "lab_import",
      outcome: "ok",
      sent: [{ to: "anthropic", kinds: ["labResults"] }],
    });
  });

  it("should leave no Trace when the athlete withholds the document", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    const trace = startTraceRun({ feature: "lab_import", traces });

    // Act
    await runLabExtraction({
      ...makeInput(),
      trace,
      askHealth: async () => "withhold",
    });

    // Assert
    expect(await traces.list()).toHaveLength(0);
  });

  it("should record a failed run in its Trace", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    const trace = startTraceRun({ feature: "lab_import", traces });
    mockRunGenerateAgent.mockRejectedValueOnce(new Error("down"));

    // Act
    const run = runLabExtraction({ ...makeInput(), trace });

    // Assert
    await expect(run).rejects.toThrow("down");
    expect((await traces.list())[0]?.outcome).toBe("failed");
  });

  it("should leave no Trace when the athlete withholds the document after the question waited", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    const trace = startTraceRun({ feature: "lab_import", traces });

    // Act
    await runLabExtraction({
      ...makeInput(),
      trace,
      askHealth: async () => {
        await trace.checkpoint();
        return "withhold";
      },
    });

    // Assert
    expect(await traces.list()).toHaveLength(0);
  });

  it("should leave a stopped Trace and send nothing when stopped while the athlete is asked", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    const trace = startTraceRun({ feature: "lab_import", traces });
    const stop = new AbortController();

    // Act
    const run = runLabExtraction({
      ...makeInput(),
      trace,
      signal: stop.signal,
      askHealth: async () => {
        stop.abort();
        throw new DOMException("Aborted", "AbortError");
      },
    });

    // Assert
    await expect(run).rejects.toThrow(/abort/i);
    expect(mockCreateLanguageModel).not.toHaveBeenCalled();
    expect((await traces.list())[0]).toMatchObject({
      outcome: "stopped",
      sent: [],
    });
  });
});
