import { CfnOutput, RemovalPolicy, Stack, Tags } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  HttpStage,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import { createAlarms } from "./alarms";
import { parseAllowedOrigins } from "./cors";
import { createLambda } from "./lambda";

export class GarminProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    Tags.of(this).add("Project", "kaiord");
    Tags.of(this).add("Owner", "pablo-albaladejo");
    Tags.of(this).add("Environment", "production");

    const allowedOrigins = parseAllowedOrigins(this.node);
    const alarmEmail = this.node.tryGetContext("alarmEmail") as
      | string
      | undefined;

    const logGroup = new LogGroup(this, "LambdaLogs", {
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const handler = createLambda(this, logGroup);
    const api = this.createApi(allowedOrigins, handler);

    new CfnOutput(this, "ApiUrl", {
      value: `https://${api.apiId}.execute-api.${this.region}.amazonaws.com/push`,
      description: "Garmin proxy API Gateway URL (POST endpoint)",
    });

    if (alarmEmail) {
      createAlarms(this, { api, handler, alarmEmail });
    }
  }

  private createApi(allowedOrigins: string[], handler: NodejsFunction) {
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
      throttle: { rateLimit: 10, burstLimit: 5 },
    });

    const integration = new HttpLambdaIntegration("PushIntegration", handler);
    api.addRoutes({
      path: "/push",
      methods: [HttpMethod.POST],
      integration,
    });

    return api;
  }
}
