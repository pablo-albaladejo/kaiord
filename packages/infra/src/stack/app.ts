#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { GarminProxyStack } from "./garmin-proxy-stack";

const app = new App();

new GarminProxyStack(app, "KaiordGarminProxy", {
  description: "Kaiord Garmin Connect proxy — stateless workout push",
});
