type GarminStatusProps = {
  extensionInstalled: boolean;
  sessionActive: boolean;
  lastError: string | null;
};

export const GarminStatus: React.FC<GarminStatusProps> = ({
  extensionInstalled,
  sessionActive,
  lastError,
}) => (
  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
    {!extensionInstalled && (
      <>
        <p>
          The Kaiord Garmin Bridge extension is not detected. Make sure it is
          installed AND enabled in your browser.
        </p>
        <p className="text-xs">
          Chrome or Chromium-based browser required. Install from{" "}
          <a
            href="https://github.com/pablo-albaladejo/kaiord"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            GitHub
          </a>{" "}
          (load unpacked from packages/garmin-bridge).
        </p>
      </>
    )}
    {extensionInstalled && !sessionActive && (
      <p>
        Extension detected but Garmin session is not active. Open Garmin Connect
        in another tab and navigate around.
      </p>
    )}
    {extensionInstalled && sessionActive && (
      <p className="text-green-600 dark:text-green-400">
        Connected to Garmin Connect via extension.
      </p>
    )}
    {lastError && !sessionActive && (
      <p className="text-red-600 dark:text-red-400">{lastError}</p>
    )}
  </div>
);
