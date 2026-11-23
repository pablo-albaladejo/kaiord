import { useState } from "react";

import { useToastContext } from "../../../../contexts/ToastContext";
import { useTraces } from "../../../../hooks/use-traces";
import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button";
import { TraceList } from "./TraceList";

const DeleteAll = ({ onDelete }: { onDelete: () => Promise<void> }) => {
  const t = useTranslate("settings");
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <Button variant="secondary" onClick={() => setAsking(true)}>
        {t("traces.deleteAll")}
      </Button>
    );
  return (
    <div role="group" className="flex flex-wrap items-center gap-2">
      <p className="m-0 text-sm text-ink-body">{t("traces.deleteConfirm")}</p>
      <Button
        variant="danger"
        onClick={() => void onDelete().then(() => setAsking(false))}
      >
        {t("traces.deleteConfirmAction")}
      </Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>
        {t("traces.deleteCancel")}
      </Button>
    </div>
  );
};

/** Settings, Privacy: the athlete's Traces, to read, export or delete. */
export const TracesSection: React.FC = () => {
  const t = useTranslate("settings");
  const toast = useToastContext();
  const { traces, exportAll, deleteAll } = useTraces();
  const onExport = () =>
    void exportAll().catch(() => toast.error(t("traces.exportFailed")));
  if (!traces) return null;
  return (
    <section data-testid="traces-section" className="space-y-3">
      <h3 className="m-0 text-sm font-semibold text-ink-body">
        {t("traces.title")}
      </h3>
      <p className="m-0 text-sm text-ink-body">{t("traces.intro")}</p>
      {traces.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">{t("traces.empty")}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onExport}>
              {t("traces.export")}
            </Button>
            <DeleteAll onDelete={deleteAll} />
          </div>
          <TraceList traces={traces} />
        </>
      )}
    </section>
  );
};
