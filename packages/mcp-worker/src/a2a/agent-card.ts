import { createHash } from "node:crypto";

import type { Skill } from "./skills";
import { SKILLS } from "./skills";

const VERSION_PREFIX = "1.0.0+";
const HASH_CHARS = 12;

const DESCRIPTION =
  "Deterministic workout conversion and validation for FIT, TCX, ZWO, " +
  "Garmin Connect (GCN) and KRD. No AI model runs behind it: name a skill " +
  'in the first data part of a message, {"skill": "<id>", ...arguments}. ' +
  "A2A 1.0 only: send A2A-Version: 1.0 (0.3 clients get -32009). Tasks " +
  "finish inside the reply and are not retained.";

const cardWithoutVersion = (skills: ReadonlyArray<Skill>) => ({
  name: "Kaiord",
  description: DESCRIPTION,
  supportedInterfaces: [
    {
      url: "https://kaiord.com/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
    },
  ],
  provider: { organization: "Kaiord", url: "https://kaiord.com" },
  documentationUrl: "https://kaiord.com/docs/mcp/tools",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    extendedAgentCard: false,
  },
  defaultInputModes: ["application/json", "text/plain"],
  defaultOutputModes: ["text/plain"],
  skills,
});

/**
 * D8: the version is a hash of the card's own content, so any skill change
 * changes it and nobody bumps it by hand. Only tests render the card.
 */
export const buildAgentCard = (
  skills: ReadonlyArray<Skill> = SKILLS
): Record<string, unknown> => {
  const card = cardWithoutVersion(skills);
  const hash = createHash("sha256").update(JSON.stringify(card)).digest("hex");
  const { name, description, ...rest } = card;
  const version = `${VERSION_PREFIX}${hash.slice(0, HASH_CHARS)}`;
  return { name, description, version, ...rest };
};
