type UmamiTracker = {
  track: (
    name: string,
    data?: Record<string, string | number | boolean>
  ) => void;
};

interface Window {
  umami?: UmamiTracker;
}
