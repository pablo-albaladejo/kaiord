/**
 * useEncryptionSection — runtime state for the Settings encryption block.
 *
 * Bridges the persisted toggle (`sync-encryption-pref`) and the in-memory
 * passphrase holder (`encryption-runtime`) into React state. Also decides
 * whether the one-time "AI keys upload in cleartext" warning should be
 * shown this render and marks it seen so it never appears again.
 */

import { useState } from "react";

import { setSyncPassphrase } from "../../../lib/cloud-sync/encryption-runtime";
import {
  isEncryptionEnabled,
  markPlaintextWarningSeen,
  setEncryptionEnabled,
  wasPlaintextWarningSeen,
} from "../../../lib/cloud-sync/sync-encryption-pref";

export type UseEncryptionSection = {
  enabled: boolean;
  passphrase: string;
  showWarning: boolean;
  toggle: (next: boolean) => void;
  setPassphrase: (value: string) => void;
};

export function useEncryptionSection(hasAiKeys: boolean): UseEncryptionSection {
  const [enabled, setEnabled] = useState<boolean>(() => isEncryptionEnabled());
  const [passphrase, setPassphraseState] = useState<string>("");
  const [showWarning] = useState<boolean>(() => {
    const show = hasAiKeys && !enabled && !wasPlaintextWarningSeen();
    if (show) markPlaintextWarningSeen();
    return show;
  });

  const toggle = (next: boolean) => {
    setEncryptionEnabled(next);
    setEnabled(next);
  };

  const setPassphrase = (value: string) => {
    setPassphraseState(value);
    setSyncPassphrase(value);
  };

  return { enabled, passphrase, showWarning, toggle, setPassphrase };
}
