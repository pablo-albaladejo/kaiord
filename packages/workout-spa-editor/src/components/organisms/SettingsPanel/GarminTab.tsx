import { useEffect } from "react";

import { useGarminBridge } from "../../../contexts";
import { Button } from "../../atoms/Button";
import { GarminStatus } from "./GarminStatus";

export const GarminTab: React.FC = () => {
  const { extensionInstalled, sessionActive, lastError, detectExtension } =
    useGarminBridge();

  useEffect(() => {
    detectExtension();
  }, [detectExtension]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Garmin Bridge Extension
        </h3>
        <GarminStatus
          extensionInstalled={extensionInstalled}
          sessionActive={sessionActive}
          lastError={lastError}
        />
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={() => detectExtension()}
        >
          Refresh Status
        </Button>
      </section>
    </div>
  );
};
