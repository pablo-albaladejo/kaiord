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

/** The name of every plugin in the init message that is not a known builtin. */
export const strayPlugins = (plugins: Array<unknown>): Array<string> =>
  plugins.flatMap((item) => {
    const parsed = pluginSchema.safeParse(item);
    if (!parsed.success) return ["<unrecognized plugin entry>"];
    return isKnownBuiltin(parsed.data) ? [] : [parsed.data.name];
  });
