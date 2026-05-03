/**
 * LinkedAccountsSection — Profile Settings tab for coaching account links.
 *
 * targetProfileId is captured at click time; toasts NEVER include
 * externalUserName / externalUserId (PII rule). useTrain2GoSource
 * manages the connect AbortController so leaving the panel cancels.
 */

import type { Profile } from "../../../../types/profile";
import { LinkedAccountRow } from "./LinkedAccountRow";
import type { SourceMeta } from "./use-linked-account-row";

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
