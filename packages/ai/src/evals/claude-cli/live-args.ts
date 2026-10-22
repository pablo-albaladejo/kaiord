export type LiveArgs = { repeat: number; record: boolean; calibrate: boolean };

/** `--repeat N`, `--record`, `--calibrate`; a literal `--` from pnpm is ignored. */
export const parseLiveArgs = (argv: ReadonlyArray<string>): LiveArgs => {
  const args: LiveArgs = { repeat: 1, record: false, calibrate: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--record") args.record = true;
    else if (arg === "--calibrate") args.calibrate = true;
    else if (arg === "--repeat") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--repeat takes a positive integer");
      }
      args.repeat = value;
    } else throw new Error(`unknown argument ${JSON.stringify(arg)}`);
  }
  if (args.record && args.repeat !== 1) {
    throw new Error("--record records one cassette per case: drop --repeat");
  }
  if (args.calibrate && (args.record || args.repeat !== 1)) {
    throw new Error("--calibrate makes one call and takes no other argument");
  }
  return args;
};
