import { AttentionMark } from "../../atoms/AttentionMark";
import { Button } from "../../atoms/Button/Button";

export type SettingsAttentionModel = {
  /** One line naming what broke. */
  title: string;
  /** One line naming the consequence of it being broken. */
  detail?: string;
  /** Omitted on the sidebar chip, which is not itself actionable. */
  action?: { label: string; onSelect: () => void };
};

export type SettingsAttentionProps = {
  /** `null` renders nothing, which is the healthy state. */
  attention: SettingsAttentionModel | null;
  variant: "banner" | "chip";
};

/* Elevation and a mark, not a hue: warning left the palette, so what needs the
   reader says so with an icon and a sentence. */
const SHELL_CLASS =
  "flex gap-3 rounded-2xl border border-edge bg-surface-elevated p-3";

const VARIANT_CLASS = {
  banner: "items-center",
  chip: "items-start",
} as const satisfies Record<SettingsAttentionProps["variant"], string>;

export const SettingsAttention = ({
  attention,
  variant,
}: SettingsAttentionProps) => {
  if (attention === null) return null;

  return (
    // The surface appears asynchronously — seconds after mount, and again on
    // any later poll — so it announces itself rather than waiting to be found.
    <div
      role="status"
      aria-live="polite"
      className={`${SHELL_CLASS} ${VARIANT_CLASS[variant]}`}
      data-testid={`settings-attention-${variant}`}
    >
      <AttentionMark className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p
          title={attention.title}
          className="truncate text-sm font-semibold text-ink-strong"
        >
          {attention.title}
        </p>
        {attention.detail !== undefined && (
          <p
            title={attention.detail}
            className="truncate text-xs text-ink-body"
          >
            {attention.detail}
          </p>
        )}
      </div>
      {variant === "banner" && attention.action !== undefined && (
        <Button
          variant="secondary"
          size="sm"
          onClick={attention.action.onSelect}
          data-testid="settings-attention-action"
        >
          {attention.action.label}
        </Button>
      )}
    </div>
  );
};
