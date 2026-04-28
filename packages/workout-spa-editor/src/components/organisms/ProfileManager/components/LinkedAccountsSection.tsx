/**
 * LinkedAccountsSection — Profile Settings tab for coaching account links.
 *
 * targetProfileId is captured at click time; toasts NEVER include
 * externalUserName / externalUserId (PII rule). useTrain2GoSource
 * manages the connect AbortController so leaving the panel cancels.
 */

import type { LinkedCoachingAccount } from "../../../../types/coaching-account";
import type { Profile } from "../../../../types/profile";
import { type SourceMeta, useLinkedAccountRow } from "./use-linked-account-row";

const SUPPORTED_SOURCES: SourceMeta[] = [{ id: "train2go", label: "Train2Go" }];

export type LinkedAccountsSectionProps = {
  profile: Profile;
};

export function LinkedAccountsSection({ profile }: LinkedAccountsSectionProps) {
  return (
    <div data-testid="linked-accounts-section" className="space-y-3">
      <h3 className="text-sm font-semibold">Linked Coaching Accounts</h3>
      {SUPPORTED_SOURCES.map((src) => (
        <LinkedAccountRow key={src.id} profile={profile} sourceMeta={src} />
      ))}
    </div>
  );
}

function LinkedAccountRow({
  profile,
  sourceMeta,
}: {
  profile: Profile;
  sourceMeta: SourceMeta;
}) {
  const linked = profile.linkedAccounts.find((a) => a.source === sourceMeta.id);
  const { busy, handleConnect, handleDisconnect } = useLinkedAccountRow(
    profile,
    sourceMeta
  );

  return (
    <div
      data-testid={`linked-account-row-${sourceMeta.id}`}
      className="flex items-center justify-between rounded border p-3"
    >
      <RowInfo label={sourceMeta.label} linked={linked} />
      {linked ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleDisconnect}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
        >
          Disconnect
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={handleConnect}
          className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? "Connecting…" : `Connect ${sourceMeta.label}`}
        </button>
      )}
    </div>
  );
}

type RowInfoProps = {
  label: string;
  linked: LinkedCoachingAccount | undefined;
};
const RowInfo = ({ label, linked }: RowInfoProps) => (
  <div className="text-sm">
    <div className="font-medium">{label}</div>
    <div className="text-xs text-muted-foreground">
      {linked ? (
        <>
          Connected as <strong>{linked.externalUserName}</strong>
        </>
      ) : (
        "Not connected"
      )}
    </div>
  </div>
);
