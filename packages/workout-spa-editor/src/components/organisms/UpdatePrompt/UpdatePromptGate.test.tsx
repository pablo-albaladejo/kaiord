import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { setUpdateState } from "../../../lib/service-worker/update-store";
import { render, screen } from "../../../test-utils";
import { UpdatePromptGate } from "./UpdatePromptGate";

describe("UpdatePromptGate", () => {
  beforeEach(() => {
    act(() => setUpdateState("idle"));
  });

  it("should mount no prompt while no new version is waiting", () => {
    // Arrange

    // Act
    render(<UpdatePromptGate />);

    // Assert
    expect(screen.queryByTestId("update-prompt")).not.toBeInTheDocument();
  });

  it("should load and show the prompt once a new version is waiting", async () => {
    // Arrange
    render(<UpdatePromptGate />);

    // Act
    act(() => setUpdateState("available"));

    // Assert
    expect(await screen.findByTestId("update-prompt")).toHaveTextContent(
      "New version available"
    );
  });
});
