/**
 * TutorialOverlay Component
 *
 * Overlay with highlighted element.
 */

import * as Dialog from "@radix-ui/react-dialog";

type TutorialOverlayProps = {
  highlightedElement: HTMLElement | null;
};

export function TutorialOverlay({ highlightedElement }: TutorialOverlayProps) {
  return (
    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      {highlightedElement && (
        <div
          className="absolute rounded-lg ring-4 ring-primary-500 ring-offset-4 ring-offset-black/70 transition-all duration-300"
          style={{
            top: `${highlightedElement.offsetTop}px`,
            left: `${highlightedElement.offsetLeft}px`,
            width: `${highlightedElement.offsetWidth}px`,
            height: `${highlightedElement.offsetHeight}px`,
          }}
          aria-hidden="true"
        />
      )}
    </Dialog.Overlay>
  );
}
