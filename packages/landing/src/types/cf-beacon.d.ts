interface CfBeacon {
  pushEvent: (
    name: string,
    props?: Record<string, string | number | boolean>
  ) => void;
}

interface Window {
  cfBeacon?: CfBeacon;
}
