import { forwardRef } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button, type ButtonSize } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type PushStatus = "idle" | "pushing" | "done";

type PushButtonFaceProps = {
  status: PushStatus;
  size: Extract<ButtonSize, "md" | "lg">;
  full: boolean;
  onPush: () => void;
  /** Idle only: the bridge is not detected or Garmin is signed out. */
  disabled?: boolean;
};

/** The send button's three looks: send, sending and sent. */
export const PushButtonFace = forwardRef<
  HTMLButtonElement,
  PushButtonFaceProps
>(({ status, size, full, onPush, disabled = false }, ref) => {
  const t = useTranslate("workout-detail");
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
    <Button {...common} variant="primary" disabled={disabled} onClick={onPush}>
      <Icon icon={ICON_MAP.watch} size="sm" color="inherit" />
      {t("footer.send")}
    </Button>
  );
});

PushButtonFace.displayName = "PushButtonFace";
