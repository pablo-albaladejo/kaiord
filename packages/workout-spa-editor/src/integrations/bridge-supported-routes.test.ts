import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { IntegrationPolicyDirection } from "../types/integration-policy";
import { bridgeSupportsRoute } from "./bridge-supported-routes";

describe("bridgeSupportsRoute", () => {
  it.each([
    {
      bridgeId: "whoop-bridge",
      dataType: "hrv" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: true,
    },
    {
      bridgeId: "tanita-bridge",
      dataType: "weight" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: true,
    },
    {
      bridgeId: "tanita-bridge",
      dataType: "hrv" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: false,
    },
    {
      bridgeId: "trainingpeaks-bridge",
      dataType: "weight" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: true,
    },
    {
      bridgeId: "trainingpeaks-bridge",
      dataType: "body-composition" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: false,
    },
    {
      bridgeId: "trainingpeaks-bridge",
      dataType: "body-composition" as ManagedDataType,
      direction: "export" as IntegrationPolicyDirection,
      expected: false,
    },
  ])(
    "should report $expected for $bridgeId $dataType $direction",
    ({ bridgeId, dataType, direction, expected }) => {
      // Arrange

      // Act
      const result = bridgeSupportsRoute(bridgeId, dataType, direction);

      // Assert
      expect(result).toBe(expected);
    }
  );
});
