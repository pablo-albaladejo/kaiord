import { useRef, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { ProviderForm } from "./ProviderForm";
import { ProviderList } from "./ProviderList";
import type { useAiTabHandlers } from "./use-ai-tab-handlers";

type AccountsSectionProps = {
  providers: LlmProviderConfig[];
  handlers: Pick<
    ReturnType<typeof useAiTabHandlers>,
    "onAdd" | "onRemove" | "onUpdate"
  >;
};

/** The AI accounts every athlete shares, with the add form on demand. */
export function AccountsSection({ providers, handlers }: AccountsSectionProps) {
  const t = useTranslate("settings");
  const [adding, setAdding] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Closing unmounts the form, so it reopens blank: first provider type,
  // empty fields, no message left from the previous add.
  const close = () => {
    setAdding(false);
    requestAnimationFrame(() => addButton.current?.focus());
  };

  return (
    <div className="space-y-3">
      <div>
        <h3
          ref={heading}
          tabIndex={-1}
          className="text-sm font-semibold text-ink-body outline-none"
        >
          {t("accounts.title")}
        </h3>
        <p className="m-0 text-xs text-ink-muted">{t("accounts.shared")}</p>
      </div>
      <ProviderList
        providers={providers}
        onRemove={handlers.onRemove}
        onRemoved={() => (addButton.current ?? heading.current)?.focus()}
        onUpdate={handlers.onUpdate}
      />
      {adding ? (
        <ProviderForm onAdd={handlers.onAdd} onDone={close} onCancel={close} />
      ) : (
        <Button
          ref={addButton}
          size="sm"
          variant="secondary"
          onClick={() => setAdding(true)}
        >
          <Icon icon={ICON_MAP.plus} size="sm" color="inherit" />
          {t("accounts.add")}
        </Button>
      )}
    </div>
  );
}
