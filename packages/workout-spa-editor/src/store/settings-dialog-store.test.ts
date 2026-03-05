import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsDialogStore } from "./settings-dialog-store";

describe("settings-dialog-store", () => {
  beforeEach(() => {
    useSettingsDialogStore.setState({ open: false });
  });

  it("should start closed", () => {
    expect(useSettingsDialogStore.getState().open).toBe(false);
  });

  it("should open when show is called", () => {
    useSettingsDialogStore.getState().show();

    expect(useSettingsDialogStore.getState().open).toBe(true);
  });

  it("should close when hide is called", () => {
    useSettingsDialogStore.setState({ open: true });

    useSettingsDialogStore.getState().hide();

    expect(useSettingsDialogStore.getState().open).toBe(false);
  });

  it("should toggle from closed to open", () => {
    useSettingsDialogStore.getState().toggle();

    expect(useSettingsDialogStore.getState().open).toBe(true);
  });

  it("should toggle from open to closed", () => {
    useSettingsDialogStore.setState({ open: true });

    useSettingsDialogStore.getState().toggle();

    expect(useSettingsDialogStore.getState().open).toBe(false);
  });
});
