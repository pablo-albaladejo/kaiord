import { register } from "node:module";

/** `tsx --import ./scripts/md-text-loader.mjs`: lets the eval CLIs run from source. */
register("./md-text-hooks.mjs", import.meta.url);
