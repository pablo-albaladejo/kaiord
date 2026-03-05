import { Stack, Duration, RemovalPolicy } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpApi, CorsHttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpStage } from "aws-cdk-lib/aws-apigatewayv2";
import type { Construct } from "constructs";

export class GarminProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const allowedOrigins = (this.node.tryGetContext("allowedOrigins") as
      | string[]
      | undefined) ?? ["*"];

    const logGroup = new LogGroup(this, "LambdaLogs", {
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handler = new NodejsFunction(this, "PushHandler", {
      entry: "src/lambda/handler.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_24_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      logGroup,
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node24",
        format: OutputFormat.ESM,
        mainFields: ["module", "main"],
      },
    });

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
  }
}
