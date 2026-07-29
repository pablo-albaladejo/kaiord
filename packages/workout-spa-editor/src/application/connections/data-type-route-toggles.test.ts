import { describe, expect, it } from "vitest";

import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import type { IntegrationPolicy } from "../../types/integration-policy";
import {
  buildRouteToggles,
  type RouteToggleSignals,
} from "./data-type-route-toggles";

const signals = (
  announced: Record<string, readonly string[]>,
  connected: readonly string[] = Object.keys(announced)
): RouteToggleSignals => ({
  announces: (bridgeId, token) => (announced[bridgeId] ?? []).includes(token),
  supportsRoute: bridgeSupportsRoute,
  isBridgeConnected: (bridgeId) => connected.includes(bridgeId),
});

const route = (bridgeId: string, enabled: boolean): IntegrationPolicy =>
  ({ bridgeId, enabled, direction: "import" }) as IntegrationPolicy;

const bridgeIds = (...args: Parameters<typeof buildRouteToggles>): string[] =>
  buildRouteToggles(...args).map((toggle) => toggle.bridgeId);

describe("buildRouteToggles", () => {
  it("should offer a connected announcing bridge that has no route yet", () => {
    // Arrange
    // The reachable gap this control closes: the seed migrations already ran,
    // so an extension installed today has no policy row of any kind and the
    // ranking control has nothing to rank.
    const registry = INTEGRATION_REGISTRY;

    // Act
    const toggles = buildRouteToggles(
      "sleep",
      registry,
      [],
      signals({ "whoop-bridge": ["read:sleep"] })
    );

    // Assert
    expect(toggles).toEqual([
      { bridgeId: "whoop-bridge", integrationId: "whoop", enabled: false },
    ]);
  });

  it("should report an existing route as switched on", () => {
    // Arrange
    const routes = [route("whoop-bridge", true)];

    // Act
    const toggles = buildRouteToggles(
      "sleep",
      INTEGRATION_REGISTRY,
      routes,
      signals({ "whoop-bridge": ["read:sleep"] })
    );

    // Assert
    expect(toggles).toEqual([
      { bridgeId: "whoop-bridge", integrationId: "whoop", enabled: true },
    ]);
  });

  it("should keep a switched-on route listed while its bridge announces nothing", () => {
    // Arrange
    // The extension is not running in THIS browser, but the enabled route is
    // still what the resolver reads from. Dropping it here would strand it:
    // there would be no control anywhere that could switch it back off.
    const routes = [route("whoop-bridge", true)];

    // Act
    const toggles = buildRouteToggles(
      "sleep",
      INTEGRATION_REGISTRY,
      routes,
      signals({}, [])
    );

    // Assert
    expect(toggles).toEqual([
      { bridgeId: "whoop-bridge", integrationId: "whoop", enabled: true },
    ]);
  });

  it("should not offer a switched-off route whose bridge announces nothing", () => {
    // Arrange
    // `null`/absent capabilities mean "not verified yet". Ranking tolerates
    // that; offering to CREATE a route on it would claim the bridge can carry
    // the type when nothing has said so.
    const routes = [route("whoop-bridge", false)];

    // Act
    const toggles = buildRouteToggles(
      "sleep",
      INTEGRATION_REGISTRY,
      routes,
      signals({}, [])
    );

    // Assert
    expect(toggles).toEqual([]);
  });

  it("should not offer a bridge the user has explicitly disconnected", () => {
    // Arrange
    // A disconnected source's card reads "Not connected" on this same page, so
    // a routing row that still offered it a fresh route would let one surface
    // undo what the other just did.
    const announcing = { "whoop-bridge": ["read:sleep"] };

    // Act
    const toggles = buildRouteToggles(
      "sleep",
      INTEGRATION_REGISTRY,
      [],
      signals(announcing, [])
    );

    // Assert
    expect(toggles).toEqual([]);
  });

  it("should not offer a bridge whose announced token over-claims the type", () => {
    // Arrange
    // `read:body` spans five types; Tanita reads the MyTANITA export CSV, which
    // carries weight and body composition only. The retired matrix rendered
    // this exact pairing as `na`.
    const announcing = { "tanita-bridge": ["read:body"] };

    // Act
    const stress = bridgeIds(
      "stress",
      INTEGRATION_REGISTRY,
      [],
      signals(announcing)
    );
    const weight = bridgeIds(
      "weight",
      INTEGRATION_REGISTRY,
      [],
      signals(announcing)
    );

    // Assert
    expect(stress).toEqual([]);
    expect(weight).toEqual(["tanita-bridge"]);
  });

  it("should not offer a bridge announcing some other type's token", () => {
    // Arrange
    // Train2Go announces `read:training-plan` and nothing else. A sweep that
    // offered every connected bridge — rather than every bridge announcing THIS
    // type's token — would put a coach-plan source on the Sleep row.
    const announcing = {
      "train2go-bridge": ["read:training-plan"],
      "whoop-bridge": ["read:sleep"],
    };

    // Act
    const sleep = bridgeIds(
      "sleep",
      INTEGRATION_REGISTRY,
      [],
      signals(announcing)
    );
    const planned = bridgeIds(
      "planned-session",
      INTEGRATION_REGISTRY,
      [],
      signals(announcing)
    );

    // Assert
    expect(sleep).toEqual(["whoop-bridge"]);
    expect(planned).toEqual(["train2go-bridge"]);
  });

  it("should never offer a non-bridge integration", () => {
    // Arrange
    // Manual entry has no route to switch and the api-key/aspirational entries
    // have no bridge to ask, so a registry sweep must skip them by mechanism
    // rather than by happening to have no bridge id.
    const announcing = { "whoop-bridge": ["read:sleep"] };

    // Act
    const toggles = buildRouteToggles(
      "sleep",
      INTEGRATION_REGISTRY,
      [],
      signals(announcing)
    );

    // Assert
    expect(toggles.map((toggle) => toggle.integrationId)).toEqual(["whoop"]);
  });
});
