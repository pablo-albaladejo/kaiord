import { describe, expect, it } from "vitest";
import authMd from "../public/auth.md?raw";
import agentCardJson from "../public/.well-known/agent-card.json?raw";
import catalogJson from "../public/.well-known/ai-catalog.json?raw";
import skillsJson from "../public/.well-known/agent-skills/index.json?raw";
import cardJson from "../public/.well-known/mcp/server-card.json?raw";
import poppyJson from "../public/.well-known/poppy.json?raw";

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

  it("should list the agent card in the AI catalog", () => {
    // Arrange
    const cardUrl = `${ORIGIN}.well-known/agent-card.json`;

    // Act
    const entry = entries.find((e) => e.url === cardUrl);

    // Assert
    expect(entry?.identifier).toBe("urn:air:kaiord.com:agent:kaiord-a2a");
    expect(entry?.type).toBe("application/a2a+json");
  });
});

type Link = { href: string; type: string };
type LinkContext = { anchor: string } & Record<string, Link[] | string>;

const API_CATALOG = `${ORIGIN}.well-known/api-catalog`;
const DOCS_PAGES = import.meta.glob<string>("../../docs/**/*.md", {
  query: "?raw",
  import: "default",
});

const linkset = () =>
  (
    JSON.parse(publishedText(API_CATALOG) ?? "{}") as {
      linkset?: LinkContext[];
    }
  ).linkset ?? [];

const hrefsOf = (context: LinkContext) =>
  Object.values(context)
    .filter((value): value is Link[] => Array.isArray(value))
    .flat()
    .map((link) => link.href);

const isPublished = (href: string) => {
  const [path = ""] = href.split("#");
  return path.startsWith(`${ORIGIN}docs/`)
    ? `../../docs/${path.slice(`${ORIGIN}docs/`.length)}.md` in DOCS_PAGES
    : publishedText(path) !== undefined;
};

describe("RFC 9727 api-catalog", () => {
  it("should be published without an extension and parse as a linkset", () => {
    // Arrange
    const text = publishedText(API_CATALOG);

    // Act
    const contexts = linkset();

    // Assert
    expect(text).toBeDefined();
    expect(contexts.length).toBeGreaterThan(0);
  });

  it("should anchor exactly the endpoints that have a card", () => {
    // Arrange
    const serverCard = JSON.parse(cardJson) as ServerCard;
    const agentCard = JSON.parse(agentCardJson) as {
      supportedInterfaces: { url: string }[];
    };

    // Act
    const anchors = linkset().map((context) => context.anchor);

    // Assert
    expect(anchors).toEqual([
      ...serverCard.remotes.map((remote) => remote.url),
      ...agentCard.supportedInterfaces.map((entry) => entry.url),
    ]);
  });

  it("should point every link at a published file or docs page", () => {
    // Arrange
    const hrefs = linkset().flatMap(hrefsOf);

    // Act
    const missing = hrefs.filter((href) => !isPublished(href));

    // Assert
    expect(hrefs.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it("should not claim a status link, as there is no health endpoint", () => {
    // Arrange
    const contexts = linkset();

    // Act
    const withStatus = contexts.filter((context) => "status" in context);

    // Assert
    expect(withStatus).toEqual([]);
  });

  it("should be listed in auth.md with every anchor it declares", () => {
    // Arrange
    const anchors = linkset().map((context) => context.anchor);

    // Act
    const named = [API_CATALOG, ...anchors].map((url) => authMd.includes(url));

    // Assert
    expect(named.every(Boolean)).toBe(true);
  });
});

describe("PAP poppy.json", () => {
  it("should declare the website only, with no agent and no OAuth", () => {
    // Arrange
    const manifest = JSON.parse(poppyJson) as Record<string, unknown>;

    // Act
    const keys = Object.keys(manifest).sort();

    // Assert
    expect(keys).toEqual(["organization", "protocol_version", "web"]);
    expect(manifest.protocol_version).toBe("0.1");
    expect(manifest.web).toEqual({});
  });

  it("should name Kaiord on this domain", () => {
    // Arrange
    const manifest = JSON.parse(poppyJson) as {
      organization: Record<string, unknown>;
    };

    // Act
    const organization = manifest.organization;

    // Assert
    expect(organization).toEqual({ name: "Kaiord", domain: "kaiord.com" });
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

  it("should state the rate budget shared by both endpoints", () => {
    // Arrange
    const budget = /10 requests per 10 s per IP across .\/mcp. and .\/a2a./;

    // Act
    const statesBudget = budget.test(authMd);

    // Assert
    expect(statesBudget).toBe(true);
  });

  it("should say which A2A version the endpoint serves", () => {
    // Arrange
    const statement = "A2A 1.0 only; 0.3 clients";

    // Act
    const flat = authMd.replace(/\s+/g, " ");

    // Assert
    expect(flat).toContain(statement);
    expect(flat).toContain("get -32009");
  });
});

type AgentCard = {
  description: string;
  supportedInterfaces: {
    url: string;
    protocolBinding: string;
  }[];
  defaultOutputModes: string[];
  skills: unknown[];
};

const A2A_ENDPOINT = "https://kaiord.com/a2a";
const SKILL_COUNT = 8;

describe("A2A agent card", () => {
  it("should expose one JSON-RPC interface at the A2A endpoint", () => {
    // Arrange
    const card = JSON.parse(agentCardJson) as AgentCard;

    // Act
    const [first, ...others] = card.supportedInterfaces;

    // Assert
    expect(others).toEqual([]);
    expect(first?.url).toBe(A2A_ENDPOINT);
    expect(first?.protocolBinding).toBe("JSONRPC");
  });

  it("should declare no security fields", () => {
    // Arrange
    const card = JSON.parse(agentCardJson) as AgentCard;

    // Act
    const keys = Object.keys(card);

    // Assert
    expect(keys).not.toContain("securitySchemes");
    expect(keys).not.toContain("security");
  });

  it("should list every skill, answer in text and state its one version", () => {
    // Arrange
    const card = JSON.parse(agentCardJson) as AgentCard;

    // Act
    const skillCount = card.skills.length;

    // Assert
    expect(skillCount).toBe(SKILL_COUNT);
    expect(card.defaultOutputModes).toContain("text/plain");
    expect(card.description).toContain("A2A 1.0 only");
  });
});
