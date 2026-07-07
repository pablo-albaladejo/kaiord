/**
 * Reactive reads for the lab history section. Each `useLiveQuery` observes the
 * `labValues`/`labReports` tables through `persistence.labs`, so a save or a
 * delete re-renders the list without manual invalidation.
 */
import type { LabReport } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import {
  getLabReport,
  type LabReportDetail,
  listLabReports,
} from "../../../../application/lab/lab-queries";
import { usePersistence } from "../../../../contexts/persistence-context";
import {
  buildLabParameterSummaries,
  type LabParameterSummary,
} from "./build-lab-parameter-summaries";

export const useLabParameterSummariesLive = (
  profileId: string
): LabParameterSummary[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery(
    async () =>
      buildLabParameterSummaries(
        await persistence.labs.getValuesByProfile(profileId)
      ),
    [profileId]
  );
};

export const useLabReportsLive = (
  profileId: string
): LabReport[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery(
    () => listLabReports(persistence.labs, profileId),
    [profileId]
  );
};

export const useLabReportDetailLive = (
  reportId: string | null
): LabReportDetail | null | undefined => {
  const persistence = usePersistence();
  return useLiveQuery(
    async () =>
      reportId
        ? ((await getLabReport(persistence.labs, reportId)) ?? null)
        : null,
    [reportId]
  );
};
