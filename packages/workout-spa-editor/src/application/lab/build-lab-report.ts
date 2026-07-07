/** buildLabReport — assemble one `LabReport` from the form's header fields. */
import type { LabReport } from "@kaiord/core";

export type FastingInput = "unspecified" | "yes" | "no";

export type LabReportHeaderInput = {
  date: string;
  labName: string;
  fasting: FastingInput;
  drawTime: string;
  notes: string;
};

export type BuildLabReportContext = {
  id: string;
  profileId: string;
};

export function buildLabReport(
  header: LabReportHeaderInput,
  ctx: BuildLabReportContext
): LabReport {
  return {
    id: ctx.id,
    profileId: ctx.profileId,
    date: header.date,
    labName: header.labName.trim() || undefined,
    fasting:
      header.fasting === "unspecified" ? undefined : header.fasting === "yes",
    drawTime: header.drawTime.trim() || undefined,
    notes: header.notes.trim() || undefined,
    provenance: { source: "manual" },
  };
}
