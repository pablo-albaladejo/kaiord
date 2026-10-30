import { describe, expect, it } from "vitest";
import authMd from "../public/auth.md?raw";
import catalogJson from "../public/.well-known/ai-catalog.json?raw";
import skillsJson from "../public/.well-known/agent-skills/index.json?raw";
import cardJson from "../public/.well-known/mcp/server-card.json?raw";

type SkillEntry = { name: string; url: string; digest: string };
type CatalogEntry = {
  url?: string;
  data?: unknown;
  identifier: string;
  type?: string;
};
type ServerCard = {
  version: string;
  remotes: { url: string }[];
  serverInfo: { version: string };
  transport: { endpoint: string };
  capabilities: Record<string, unknown>;
};

const MCP_ENDPOINT = "https://kaiord.com/mcp";
const ORIGIN = "https://kaiord.com/";
const HEX = 16;
const PUBLISHED = import.meta.glob<string>("../public/.well-known/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
});

const publishedText = (url: string) =>
  PUBLISHED[`../public/${url.slice(ORIGIN.length)}`];

const sha256 = async (text: string) => {
  const bytes = new TextEncoder().encode(text);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...hash].map((b) => b.toString(HEX).padStart(2, "0")).join("");
};

const { skills } = JSON.parse(skillsJson) as { skills: SkillEntry[] };
const { entries } = JSON.parse(catalogJson) as { entries: CatalogEntry[] };

describe("well-known agent discovery documents", () => {
  it("should pin each skill digest to the bytes that are published", async () => {
    // Arrange
    const published = skills.map((skill) => publishedText(skill.url) ?? "");

    // Act
    const digests = await Promise.all(published.map(sha256));

    // Assert
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.map((skill) => skill.digest)).toEqual(
      digests.map((hex) => `sha256:${hex}`)
    );
  });

  it("should give every catalog entry exactly one of url or data", () => {
    // Arrange
    const hasUrl = (entry: CatalogEntry) => entry.url !== undefined;

    // Act
    const invalid = entries.filter(
      (entry) => hasUrl(entry) === (entry.data !== undefined)
    );

    // Assert
    expect(entries.length).toBeGreaterThan(0);
    expect(invalid.map((entry) => entry.identifier)).toEqual([]);
  });

  it("should only point well-known urls on this origin at published files", () => {
    // Arrange
    const urls = [
      ...entries.map((e) => e.url ?? ""),
      ...skills.map((s) => s.url),
    ];

    // Act
    const missing = urls
      .filter((url) => url.startsWith(`${ORIGIN}.well-known/`))
      .filter((url) => publishedText(url) === undefined);

    // Assert
    expect(missing).toEqual([]);
  });

  it("should point every server card field at the one remote endpoint", () => {
    // Arrange
    const card = JSON.parse(cardJson) as ServerCard;

    // Act
    const endpoints = [
      ...card.remotes.map((remote) => remote.url),
      card.transport.endpoint,
    ];

    // Assert
    expect(endpoints).toEqual([MCP_ENDPOINT, MCP_ENDPOINT]);
    expect(card.serverInfo.version).toBe(card.version);
    expect(card.capabilities).toHaveProperty("tools");
  });

  it("should list the server card in the AI catalog", () => {
    // Arrange
    const cardUrl = `${ORIGIN}.well-known/mcp/server-card.json`;

    // Act
    const entry = entries.find((e) => e.url === cardUrl);

    // Assert
    expect(entry?.type).toBe("application/mcp-server-card+json");
  });
});

describe("auth.md", () => {
  it("should state that no authentication and no registration exist", () => {
    // Arrange
    const authentication = /^## Authentication\s*\n+None\b/m;
    const registration = /^## Registration\s*\n+(None|There is no)/m;

    // Act
    const sections = [authentication.test(authMd), registration.test(authMd)];

    // Assert
    expect(sections).toEqual([true, true]);
  });

  it("should name the remote endpoint and no OAuth issuer", () => {
    // Arrange
    const issuer = /oauth-authorization-server|openid-configuration|issuer/i;

    // Act
    const namesIssuer = issuer.test(authMd);

    // Assert
    expect(authMd).toContain(MCP_ENDPOINT);
    expect(namesIssuer).toBe(false);
  });
});
