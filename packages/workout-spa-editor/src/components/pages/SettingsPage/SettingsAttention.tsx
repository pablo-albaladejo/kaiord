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
  /**
   * `null` renders nothing. Nothing computes attention yet — the Settings
   * shell passes `null` until the bridge connection model is mounted.
   */
  attention: SettingsAttentionModel | null;
  variant: "banner" | "chip";
};

const SHELL_CLASS =
  "flex gap-3 rounded-xl border border-amber-400/40 bg-amber-50 p-3 dark:bg-amber-950/30";

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
    <div
      className={`${SHELL_CLASS} ${VARIANT_CLASS[variant]}`}
      data-testid={`settings-attention-${variant}`}
    >
      <span
        aria-hidden="true"
        className="mt-1 h-2 w-2 flex-none rounded-full bg-amber-500"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {attention.title}
        </p>
        {attention.detail !== undefined && (
          <p className="truncate text-xs text-gray-600 dark:text-gray-400">
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
