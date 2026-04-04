import { CfnOutput, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  HttpStage,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Alarm, Metric, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { TailscaleLambdaExtension } from "tailscale-lambda-extension";
import type { Construct } from "constructs";

export class GarminProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const rawOrigins = this.node.tryGetContext("allowedOrigins") as
      | string
      | string[]
      | undefined;
    const allowedOrigins: string[] = (() => {
      if (Array.isArray(rawOrigins)) return rawOrigins;
      if (typeof rawOrigins === "string") {
        try {
          const parsed: unknown = JSON.parse(rawOrigins);
          if (
            Array.isArray(parsed) &&
            parsed.every((v) => typeof v === "string")
          ) {
            return parsed as string[];
          }
        } catch {
          // fall through to default
        }
      }
      return ["*"];
    })();

    const logGroup = new LogGroup(this, "LambdaLogs", {
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const tsSecretName =
      (this.node.tryGetContext("tsSecretName") as string) ||
      "tailscale-api-key";
    const tsExitNode = this.node.tryGetContext("tsExitNode") as
      | string
      | undefined;

    const tailscale = new TailscaleLambdaExtension(this, "TailscaleExt");

    const handler = new NodejsFunction(this, "PushHandler", {
      entry: "src/lambda/handler.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_24_X,
      timeout: Duration.seconds(60),
      memorySize: 512,
      logGroup,
      layers: [tailscale.layer],
      environment: {
        TS_SECRET_API_KEY: tsSecretName,
        TS_HOSTNAME: "garmin-proxy-lambda",
        ...(tsExitNode ? { TS_EXIT_NODE: tsExitNode } : {}),
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
      this,
      "TailscaleApiKey",
      tsSecretName
    );
    tsSecret.grantRead(handler);

    const api = new HttpApi(this, "GarminProxyApi", {
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: allowedOrigins,
        allowMethods: [CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowHeaders: ["Content-Type"],
      },
    });

    new HttpStage(this, "DefaultStage", {
      httpApi: api,
      stageName: "$default",
      autoDeploy: true,
      throttle: {
        rateLimit: 10,
        burstLimit: 5,
      },
    });

    const integration = new HttpLambdaIntegration("PushIntegration", handler);

    api.addRoutes({
      path: "/push",
      methods: [HttpMethod.POST],
      integration,
    });

    new CfnOutput(this, "ApiUrl", {
      value: `https://${api.apiId}.execute-api.${this.region}.amazonaws.com`,
      description: "Garmin proxy API Gateway URL",
    });

    new Alarm(this, "ApiGateway5xxAlarm", {
      metric: new Metric({
        namespace: "AWS/ApiGateway",
        metricName: "5xx",
        dimensionsMap: { ApiId: api.apiId },
        period: Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: "API Gateway 5xx errors > 5 in 5 minutes",
    });

    new Alarm(this, "LambdaErrorsAlarm", {
      metric: handler.metricErrors({ period: Duration.minutes(5) }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: "Lambda invocation errors > 5 in 5 minutes",
    });
  }
}
