import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { expect } from "vitest";

/**
 * Opens the header's account menu the way a user can: once its trigger is
 * enabled. The trigger stays natively disabled until the profile reads
 * resolve, so a click sent before then is dropped and the menu never opens.
 */
export async function openAccountMenu(user: UserEvent): Promise<void> {
  const trigger = screen.getByTestId("status-header-account-button");
  await waitFor(() => expect(trigger).toBeEnabled());
  await user.click(trigger);
}
