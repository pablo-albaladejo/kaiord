import { convertFitToKrd } from "./use-cases/convert-fit-to-krd";
import { convertGarminToKrd } from "./use-cases/convert-garmin-to-krd";
import { convertKrdToFit } from "./use-cases/convert-krd-to-fit";
import { convertKrdToGarmin } from "./use-cases/convert-krd-to-garmin";
import { convertKrdToTcx } from "./use-cases/convert-krd-to-tcx";
import { convertKrdToZwift } from "./use-cases/convert-krd-to-zwift";
import { convertTcxToKrd } from "./use-cases/convert-tcx-to-krd";
import { convertZwiftToKrd } from "./use-cases/convert-zwift-to-krd";
import { createConsoleLogger } from "../adapters/logger/console-logger";
import { createSchemaValidator } from "../domain/validation/schema-validator";
import { createToleranceChecker } from "../domain/validation/tolerance-checker";
import type { AdapterProviders, Providers } from "./provider-types";
import type { Logger } from "../ports/logger";

export type { AdapterProviders, Providers } from "./provider-types";

type WireCtx = {
  result: Providers;
  sv: ReturnType<typeof createSchemaValidator>;
  log: Logger;
};

const wireFit = (ctx: WireCtx, fit: NonNullable<AdapterProviders["fit"]>) => {
  ctx.result.fitReader = fit.fitReader;
  ctx.result.fitWriter = fit.fitWriter;
  ctx.result.convertFitToKrd = convertFitToKrd(fit.fitReader, ctx.sv, ctx.log);
  ctx.result.convertKrdToFit = convertKrdToFit(fit.fitWriter, ctx.sv, ctx.log);
};

const wireTcx = (ctx: WireCtx, tcx: NonNullable<AdapterProviders["tcx"]>) => {
  ctx.result.tcxReader = tcx.tcxReader;
  ctx.result.tcxWriter = tcx.tcxWriter;
  ctx.result.tcxValidator = tcx.tcxValidator;
  ctx.result.convertTcxToKrd = convertTcxToKrd(tcx.tcxReader, ctx.sv, ctx.log);
  ctx.result.convertKrdToTcx = convertKrdToTcx(tcx.tcxWriter, ctx.sv, ctx.log);
};

const wireZwo = (ctx: WireCtx, zwo: NonNullable<AdapterProviders["zwo"]>) => {
  ctx.result.zwiftReader = zwo.zwiftReader;
  ctx.result.zwiftWriter = zwo.zwiftWriter;
  ctx.result.zwiftValidator = zwo.zwiftValidator;
  ctx.result.convertZwiftToKrd = convertZwiftToKrd(
    zwo.zwiftReader,
    ctx.sv,
    ctx.log
  );
  ctx.result.convertKrdToZwift = convertKrdToZwift(
    zwo.zwiftWriter,
    ctx.sv,
    ctx.log
  );
};

const wireGarmin = (
  ctx: WireCtx,
  g: NonNullable<AdapterProviders["garmin"]>
) => {
  ctx.result.garminReader = g.garminReader;
  ctx.result.garminWriter = g.garminWriter;
  ctx.result.convertGarminToKrd = convertGarminToKrd(
    g.garminReader,
    ctx.sv,
    ctx.log
  );
  ctx.result.convertKrdToGarmin = convertKrdToGarmin(
    g.garminWriter,
    ctx.sv,
    ctx.log
  );
};

const wireAdapters = (
  result: Providers,
  adapters: AdapterProviders | undefined,
  sv: ReturnType<typeof createSchemaValidator>,
  log: Logger
): void => {
  const ctx: WireCtx = { result, sv, log };
  if (adapters?.fit) wireFit(ctx, adapters.fit);
  if (adapters?.tcx) wireTcx(ctx, adapters.tcx);
  if (adapters?.zwo) wireZwo(ctx, adapters.zwo);
  if (adapters?.garmin) wireGarmin(ctx, adapters.garmin);
};

/**
 * Creates default providers with adapter dependencies wired together.
 *
 * @param adapters - Optional adapter providers (FIT, TCX, ZWO, Garmin)
 * @param logger - Optional custom logger
 * @returns Providers object with available dependencies and use cases
 */
export const createDefaultProviders = (
  adapters?: AdapterProviders,
  logger?: Logger
): Providers => {
  const log = logger || createConsoleLogger();
  const sv = createSchemaValidator(log);
  const result: Providers = {
    schemaValidator: sv,
    toleranceChecker: createToleranceChecker(),
    logger: log,
  };
  wireAdapters(result, adapters, sv, log);
  return result;
};
