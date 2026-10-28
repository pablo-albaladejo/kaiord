import { afterEach, describe, expect, it, vi } from "vitest";

import { RESOURCES, createTools, setupWebMcp } from "./webmcp";

const installModelContext = (
  registerTool: (tool: { name: string }) => unknown
) =>
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool },
  });

const toolNamed = (name: string, navigate = vi.fn()) => {
  const tool = createTools(navigate).find((t) => t.name === name);
  if (!tool) throw new Error(`missing tool ${name}`);
  return tool;
};

describe("webmcp", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "modelContext");
  });

  it("should do nothing when the browser has no model context", () => {
    // Arrange
    const navigate = vi.fn();

    // Act
    const run = () => setupWebMcp(navigate);

    // Assert
    expect(run).not.toThrow();
  });

  it("should register every tool on the document model context", () => {
    // Arrange
    const registerTool = vi.fn<(tool: { name: string }) => Promise<void>>(() =>
      Promise.resolve()
    );
    installModelContext(registerTool);

    // Act
    setupWebMcp(vi.fn());

    // Assert
    expect(registerTool.mock.calls.map(([tool]) => tool.name)).toEqual([
      "get_install_command",
      "get_kaiord_resources",
      "open_kaiord_editor",
    ]);
  });

  it("should keep registering when the browser rejects a tool", () => {
    // Arrange
    const registerTool = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("rejected");
      })
      .mockImplementation(() => Promise.reject(new Error("rejected")));
    installModelContext(registerTool);

    // Act
    setupWebMcp(vi.fn());

    // Assert
    expect(registerTool).toHaveBeenCalledTimes(createTools(vi.fn()).length);
  });

  it("should return the install command for the requested package manager", async () => {
    // Arrange
    const tool = toolNamed("get_install_command");

    // Act
    const result = await tool.execute({ packageManager: "pnpm" });

    // Assert
    expect(result.content[0].text).toBe("pnpm add @kaiord/core");
  });

  it("should list the public resources as JSON", async () => {
    // Arrange
    const tool = toolNamed("get_kaiord_resources");

    // Act
    const result = await tool.execute({});

    // Assert
    expect(JSON.parse(result.content[0].text)).toEqual(RESOURCES);
  });

  it("should navigate to the editor when asked to open it", async () => {
    // Arrange
    const navigate = vi.fn();
    const tool = toolNamed("open_kaiord_editor", navigate);

    // Act
    await tool.execute({});

    // Assert
    expect(navigate).toHaveBeenCalledWith(RESOURCES.editor);
  });
});
