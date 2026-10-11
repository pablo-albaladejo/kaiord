import { AlertCircle } from "lucide-react";

type FormatOptionWarningProps = {
  readonly id: string;
  readonly warning: string;
};

export function FormatOptionWarning({ id, warning }: FormatOptionWarningProps) {
  return (
    <p
      id={id}
      role="note"
      className="mb-2 flex items-start gap-1 text-xs text-ink-body"
    >
      <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
      {warning}
    </p>
  );
}
