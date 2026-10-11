import { forwardRef, useId } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button, type ButtonSize } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type PushStatus = "idle" | "pushing" | "done";

type PushButtonFaceProps = {
  status: PushStatus;
  size: Extract<ButtonSize, "md" | "lg">;
  full: boolean;
  onPush: () => void;
  /** Idle only: why the send is unavailable (no bridge, or signed out). */
  disabledReason?: "noExtension" | "signedOut";
};

/** The send button's three looks: send, sending and sent. */
export const PushButtonFace = forwardRef<
  HTMLButtonElement,
  PushButtonFaceProps
>(({ status, size, full, onPush, disabledReason }, ref) => {
  const t = useTranslate("workout-detail");
  const reasonId = useId();
  const common = { ref, size, className: full ? "w-full" : "" };

  // Done is stated, not coloured: the emerald pill borrowed a hue that
  // belongs to zone 3, and success is not part of this palette.
  if (status === "done") {
    return (
      <Button {...common} variant="secondary" disabled>
        <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
        {t("footer.sent")}
      </Button>
    );
  }

  if (status === "pushing") {
    return (
      <Button {...common} variant="primary" loading disabled>
        {t("footer.sending")}
      </Button>
    );
  }

  return (
    <>
      <Button
        {...common}
        variant="primary"
        disabled={disabledReason !== undefined}
        aria-describedby={disabledReason ? reasonId : undefined}
        onClick={onPush}
      >
        <Icon icon={ICON_MAP.watch} size="sm" color="inherit" />
        {t("footer.send")}
      </Button>
      {disabledReason && (
        <p id={reasonId} className="text-xs text-ink-muted">
          {t(`footer.sendDisabled.${disabledReason}`)}
        </p>
      )}
    </>
  );
});

PushButtonFace.displayName = "PushButtonFace";
