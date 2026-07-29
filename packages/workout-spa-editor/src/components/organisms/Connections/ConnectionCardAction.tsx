import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useConnectionActions } from "../../../hooks/use-connection-actions";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { canDisconnect, canReconnect } from "./connection-card-copy";

type Props = {
  source: ConnectionSource;
  profileId: string;
  open: boolean;
  onToggle: () => void;
};

const needsApiKey = (source: ConnectionSource): boolean =>
  source.mechanism === "api-key" && source.status !== "connected";

/**
 * Reconnect writes the `connected` record that undoes a disconnect. It is the
 * first place in the app that writes one — the provider's `connect` existed
 * but nothing called it — and it is offered only where it can actually work:
 * an extension that is not installed cannot be installed from here.
 */
export function ConnectionCardAction({
  source,
  profileId,
  open,
  onToggle,
}: Props) {
  const t = useTranslate("connections");
  const { connect } = useConnectionActions(profileId);

  if (canReconnect(source)) {
    return (
      <button
        type="button"
        data-testid={`connection-reconnect-${source.id}`}
        onClick={() => void connect(source.id, source.mechanism)}
      >
        <Pill tone="accent" icon="link">
          {t("manage.reconnect")}
        </Pill>
      </button>
    );
  }

  if (!canDisconnect(source) && !needsApiKey(source)) return null;

  const label = needsApiKey(source)
    ? t("manage.connect")
    : t(open ? "manage.close" : "manage.open");

  return (
    <button
      type="button"
      aria-expanded={open}
      data-testid={`connection-manage-${source.id}`}
      onClick={onToggle}
    >
      <Pill tone={needsApiKey(source) ? "accent" : "neutral"} icon="gear">
        {label}
      </Pill>
    </button>
  );
}
