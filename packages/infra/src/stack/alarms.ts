import { Duration } from "aws-cdk-lib";
import type { IFunction } from "aws-cdk-lib/aws-lambda";
import type { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { Alarm, Metric, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import type { Construct } from "constructs";

type AlarmsProps = {
  api: HttpApi;
  handler: IFunction;
  alarmEmail: string;
};

export const createAlarms = (
  scope: Construct,
  { api, handler, alarmEmail }: AlarmsProps
) => {
  const topic = new Topic(scope, "AlarmTopic", {
    displayName: "Kaiord Garmin Proxy Alarms",
  });
  topic.addSubscription(new EmailSubscription(alarmEmail));

  const snsAction = new SnsAction(topic);

  const apiGateway5xx = new Alarm(scope, "ApiGateway5xxAlarm", {
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
  apiGateway5xx.addAlarmAction(snsAction);

  const lambdaErrors = new Alarm(scope, "LambdaErrorsAlarm", {
    metric: handler.metricErrors({ period: Duration.minutes(5) }),
    threshold: 5,
    evaluationPeriods: 1,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: "Lambda invocation errors > 5 in 5 minutes",
  });
  lambdaErrors.addAlarmAction(snsAction);

  const apiGateway4xx = new Alarm(scope, "ApiGateway4xxAlarm", {
    metric: new Metric({
      namespace: "AWS/ApiGateway",
      metricName: "4xx",
      dimensionsMap: { ApiId: api.apiId },
      period: Duration.minutes(5),
      statistic: "Sum",
    }),
    threshold: 20,
    evaluationPeriods: 1,
    treatMissingData: TreatMissingData.NOT_BREACHING,
    alarmDescription: "API Gateway 4xx errors > 20 in 5 minutes (throttling)",
  });
  apiGateway4xx.addAlarmAction(snsAction);
};
