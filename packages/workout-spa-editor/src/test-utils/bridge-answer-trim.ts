/**
 * A bridge's answer as the extension hands it to the App: its own
 * `bridge-answer.js` applied with its own `personal-fields.js`, loaded from
 * the bridge package, so a Connector is checked against the real trimming.
 */
import { createRequire } from "node:module";
import { join } from "node:path";

import type { RawAnswer } from "../adapters/bridge/thin-bridge-request";

type AnswerCore = {
  toAnswer: (res: RawAnswer, personal: unknown) => RawAnswer;
};

const requireBridge = createRequire(__filename);
const bridgeFile = (bridge: string, file: string): string =>
  join(__dirname, "../../..", bridge, file);

export const trimmedByBridge = (bridge: string, raw: RawAnswer): RawAnswer => {
  const core = requireBridge(
    bridgeFile(bridge, "bridge-answer.js")
  ) as AnswerCore;
  const personal: unknown = requireBridge(
    bridgeFile(bridge, "personal-fields.js")
  );
  return core.toAnswer(raw, personal);
};

export const bridgeFixturePath = (bridge: string, name: string): string =>
  bridgeFile(bridge, join("test", "fixtures", name));
