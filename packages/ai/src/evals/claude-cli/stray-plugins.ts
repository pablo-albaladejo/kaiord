import { z } from "zod";

/**
 * Plugins compiled into the CLI itself: `--safe-mode` disables installed
 * plugins but not these, and no flag that keeps the subscription login turns
 * them off. Listed by name so a builtin added by a CLI update still aborts
 * the run until someone has looked at it.
 */
export const BUILTIN_PLUGINS: ReadonlySet<string> = new Set([
  "cc-plugin-agents-md",
  "cc-plugin-plugin-authoring",
  "cc-plugin-telemetry",
]);

const pluginSchema = z.object({
  name: z.string(),
  path: z.string(),
  source: z.string(),
});

const isKnownBuiltin = (plugin: z.output<typeof pluginSchema>) =>
  plugin.path === "builtin" &&
  plugin.source === `${plugin.name}@builtin` &&
  BUILTIN_PLUGINS.has(plugin.name);

export const MAX_PRINTED_NAME = 80;
const PLAIN_NAME = /^[\w@./-]+$/;
const UNRECOGNIZED = "<unrecognized plugin entry>";

/** Names go into the fault text, so only a short, plain one is printed. */
const printable = (name: unknown) =>
  typeof name === "string" &&
  name.length <= MAX_PRINTED_NAME &&
  PLAIN_NAME.test(name)
    ? name
    : undefined;

const strayName = (item: unknown): Array<string> => {
  const parsed = pluginSchema.safeParse(item);
  if (parsed.success) {
    if (isKnownBuiltin(parsed.data)) return [];
    return [printable(parsed.data.name) ?? UNRECOGNIZED];
  }
  const name = printable((item as { name?: unknown } | null)?.name);
  return [name === undefined ? UNRECOGNIZED : `<unrecognized: ${name}>`];
};

/**
 * The name of every plugin in the init message that is not a known builtin.
 * A missing field counts as stray: a CLI that stops reporting plugins must
 * not switch the check off.
 */
export const strayPlugins = (plugins: Array<unknown> | undefined) =>
  plugins === undefined
    ? ["<plugins field absent>"]
    : plugins.flatMap(strayName);
