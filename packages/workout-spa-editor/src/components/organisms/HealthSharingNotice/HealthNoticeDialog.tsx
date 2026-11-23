import * as Dialog from "@radix-ui/react-dialog";

import type { HealthShareAnswer } from "../../../lib/health-sharing-gate";
import { Button } from "../../atoms/Button";
import type { HealthNoticeCopy } from "./health-notice-copy";

const CONTENT_CLASS =
  "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 overflow-y-auto rounded-2xl border border-edge bg-surface p-6 shadow-lg";

const keepOpen = (event: Event) => event.preventDefault();

const Choice = (props: {
  label: string;
  result: string;
  variant: "primary" | "secondary";
  onClick: () => void;
}) => (
  <div className="space-y-1">
    <Button className="w-full" variant={props.variant} onClick={props.onClick}>
      {props.label}
    </Button>
    <p className="text-xs text-ink-muted">{props.result}</p>
  </div>
);

/** The notice itself: it cannot be dismissed without one of its answers. */
export const HealthNoticeDialog = (props: {
  copy: HealthNoticeCopy;
  onChoose: (answer: HealthShareAnswer) => void;
}) => {
  const { copy, onChoose } = props;
  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={CONTENT_CLASS}
          data-testid="health-sharing-notice"
          onEscapeKeyDown={keepOpen}
          onPointerDownOutside={keepOpen}
          onInteractOutside={keepOpen}
        >
          <Dialog.Title className="text-lg font-semibold text-ink-strong">
            {copy.title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-ink-body">
            {copy.body}
          </Dialog.Description>
          <p className="text-sm text-ink-body">{copy.terms}</p>
          <Choice
            label={copy.once}
            result={copy.onceResult}
            variant="primary"
            onClick={() => onChoose("once")}
          />
          <Choice
            label={copy.always}
            result={copy.alwaysResult}
            variant="secondary"
            onClick={() => onChoose("always")}
          />
          <Choice
            label={copy.never}
            result={copy.neverResult}
            variant="secondary"
            onClick={() => onChoose("never")}
          />
          <p className="text-xs text-ink-muted">{copy.changeLater}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
