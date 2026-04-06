import { Duration } from "aws-cdk-lib";
import type { Stack } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import type { LogGroup } from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { TailscaleLambdaExtension } from "tailscale-lambda-extension";

export const createLambda = (scope: Stack, logGroup: LogGroup) => {
  const tsSecretName =
    (scope.node.tryGetContext("tsSecretName") as string) || "tailscale-api-key";
  const tsExitNode = scope.node.tryGetContext("tsExitNode") as
    | string
    | undefined;
  const tsAdvertiseTags = scope.node.tryGetContext("tsAdvertiseTags") as
    | string
    | undefined;
  const tsExitNodePingTimeout = scope.node.tryGetContext(
    "tsExitNodePingTimeout"
  ) as string | undefined;
  const tsExitNodePingRetries = scope.node.tryGetContext(
    "tsExitNodePingRetries"
  ) as string | undefined;

  const tailscale = new TailscaleLambdaExtension(scope, "TailscaleExt");

  const handler = new NodejsFunction(scope, "PushHandler", {
    entry: "src/lambda/handler.ts",
    handler: "handler",
    runtime: Runtime.NODEJS_24_X,
    timeout: Duration.seconds(60),
    memorySize: 256,
    logGroup,
    layers: [tailscale.layer],
    environment: {
      TS_SECRET_API_KEY: tsSecretName,
      TS_HOSTNAME: "garmin-proxy-lambda",
      ...(tsExitNode ? { TS_EXIT_NODE: tsExitNode } : {}),
      ...(tsAdvertiseTags ? { TS_ADVERTISE_TAGS: tsAdvertiseTags } : {}),
      ...(tsExitNodePingTimeout
        ? { TS_EXIT_NODE_PING_TIMEOUT: tsExitNodePingTimeout }
        : {}),
      ...(tsExitNodePingRetries
        ? { TS_EXIT_NODE_PING_RETRIES: tsExitNodePingRetries }
        : {}),
    },
    bundling: {
      minify: false,
      sourceMap: true,
      target: "node24",
      format: OutputFormat.ESM,
      mainFields: ["module", "main"],
      nodeModules: ["undici", "fetch-socks", "socks"],
    },
  });

  const tsSecret = secretsmanager.Secret.fromSecretNameV2(
    scope,
    "TailscaleApiKey",
    tsSecretName
  );
  tsSecret.grantRead(handler);

  return handler;
};
