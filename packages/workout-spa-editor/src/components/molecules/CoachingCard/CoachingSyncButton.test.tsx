import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CoachingSyncButton } from "./CoachingSyncButton";

describe("CoachingSyncButton", () => {
  it("renders connect button when not connected", () => {
    render(
      <CoachingSyncButton
        connected={false}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    expect(screen.getByText("Connect to Train2Go")).toBeInTheDocument();
  });

  it("shows error when disconnected with error", () => {
    render(
      <CoachingSyncButton
        connected={false}
        loading={false}
        error="Session expired"
        onSync={vi.fn()}
        onConnect={vi.fn()}
      />
    );

    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });

  it("calls onConnect when connect button clicked", async () => {
    const onConnect = vi.fn();

    render(
      <CoachingSyncButton
        connected={false}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={onConnect}
      />
    );

    await userEvent.click(screen.getByText("Connect to Coach"));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("renders sync button when connected", () => {
    render(
      <CoachingSyncButton
        connected={true}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    expect(screen.getByText("Sync Train2Go")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <CoachingSyncButton
        connected={true}
        loading={true}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
      />
    );

    expect(screen.getByText("Syncing...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onSync when sync button clicked", async () => {
    const onSync = vi.fn();

    render(
      <CoachingSyncButton
        connected={true}
        loading={false}
        error={null}
        onSync={onSync}
        onConnect={vi.fn()}
      />
    );

    await userEvent.click(screen.getByText("Sync Coach"));

    expect(onSync).toHaveBeenCalledTimes(1);
  });
});
