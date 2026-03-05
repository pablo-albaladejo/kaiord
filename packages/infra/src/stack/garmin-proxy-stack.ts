import { Stack, Duration, RemovalPolicy } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpApi, CorsHttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import type { Construct } from "constructs";

export class GarminProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, "LambdaLogs", {
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handler = new NodejsFunction(this, "PushHandler", {
      entry: "src/lambda/handler.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      logGroup,
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node20",
        format: "esm" as never,
        mainFields: ["module", "main"],
      },
    });

    const api = new HttpApi(this, "GarminProxyApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowHeaders: ["Content-Type"],
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
