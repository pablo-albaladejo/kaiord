import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";
import { ConnectionMark } from "./ConnectionMark";

type Props = { sources: readonly ConnectionSource[] };

/**
 * Brands with no connect mechanism, listed without a control. The reference
 * design offers "Notify me" here; nothing records an interest signal, so the
 * button would be a dead end dressed as a promise.
 */
export function ConnectionsUnsupported({ sources }: Props) {
  const t = useTranslate("connections");
  if (sources.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="connections-unsupported">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
        {t("unsupported")}
      </h2>
      <p className="text-[12.5px] text-ink-muted">{t("unsupportedHint")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <div
            key={source.id}
            data-testid={`connection-card-${source.id}`}
            data-status={source.status}
            className="flex items-center gap-3 rounded-xl border border-edge bg-surface px-3 py-2.5 opacity-70"
          >
            <ConnectionMark mark={source.mark} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink-strong">
                {source.name}
              </div>
              <div
                className="text-[12.5px] text-ink-muted"
                data-testid={`connection-status-${source.id}`}
              >
                {t("status.unsupported")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
