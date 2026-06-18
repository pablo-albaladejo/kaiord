import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationsRow } from "./NotificationsRow";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotificationsRow", () => {
  it("should show an unsupported message when the API is absent", () => {
    // Arrange
    vi.stubGlobal("Notification", undefined);

    // Act
    render(<NotificationsRow enabled={false} onChange={vi.fn()} />);

    // Assert
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByText(/aren.t supported/i)).toBeInTheDocument();
  });

  it("should request permission and enable when granted", async () => {
    // Arrange
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    const onChange = vi.fn();
    render(<NotificationsRow enabled={false} onChange={onChange} />);

    // Act
    fireEvent.click(
      screen.getByRole("switch", { name: /enable notifications/i })
    );

    // Assert
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("should disable without requesting permission when toggled off", () => {
    // Arrange
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "granted", requestPermission });
    const onChange = vi.fn();
    render(<NotificationsRow enabled onChange={onChange} />);

    // Act
    fireEvent.click(
      screen.getByRole("switch", { name: /enable notifications/i })
    );

    // Assert
    expect(onChange).toHaveBeenCalledWith(false);
    expect(requestPermission).not.toHaveBeenCalled();
  });
});
