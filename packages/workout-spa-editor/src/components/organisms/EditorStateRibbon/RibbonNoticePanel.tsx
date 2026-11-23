import { useGarminBridge } from "../../../contexts";
import { useConnectionFix } from "../../molecules/ConnectionNotice/use-connection-fix";
import { useConnectionNotice } from "../../molecules/ConnectionNotice/use-connection-notice";
import type { RibbonConnection } from "./ribbon-content";
import { RibbonPanel } from "./RibbonPanel";

type Props = { connection: RibbonConnection; regionLabel: string };

const GARMIN = { bridgeId: "garmin-bridge", name: "Garmin" } as const;

/** The Garmin Connection's notice in the ribbon: one sentence, one fix. */
export function RibbonNoticePanel({ connection, regionLabel }: Props) {
  const { detectExtension } = useGarminBridge();
  const notice = useConnectionNotice(connection, GARMIN.name);
  const runFix = useConnectionFix(GARMIN.bridgeId, () => {
    void detectExtension();
  });
  if (notice === null) return null;

  return (
    <RibbonPanel
      content={{ tone: "quiet" }}
      headline={notice.message}
      regionLabel={regionLabel}
      fixLabel={notice.action}
      onFix={() => runFix(notice.fix)}
    />
  );
}
