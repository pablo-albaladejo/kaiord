import type { ConnectionNotice as Notice } from "@kaiord/i18n";

type Props = {
  notice: Notice;
  /** Where the fix happens (store listing, the Platform's sign-in). */
  href: string | null;
  /** Re-runs the check; the "try-again" fix and any fix without a page. */
  onRetry?: () => void;
  testId?: string;
};

const FIX_CLASS =
  "inline-block text-[12.5px] font-semibold text-accent underline-offset-2 hover:underline";

/**
 * One notice, one fix. The words are the Connection's own, from
 * `connectionNotice` (`@kaiord/i18n`), the function every extension popup
 * also calls; this component only lays them out and wires the one control.
 */
export function ConnectionNotice({ notice, href, onRetry, testId }: Props) {
  const asLink = notice.fix !== "try-again" && href !== null;

  return (
    <div
      role="status"
      data-testid={testId}
      data-fix={notice.fix}
      className="space-y-1"
    >
      <p className="text-[12.5px] leading-snug text-ink-strong">
        {notice.message}
      </p>
      {asLink ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={FIX_CLASS}
        >
          {notice.action}
        </a>
      ) : (
        onRetry && (
          <button type="button" onClick={onRetry} className={FIX_CLASS}>
            {notice.action}
          </button>
        )
      )}
    </div>
  );
}
