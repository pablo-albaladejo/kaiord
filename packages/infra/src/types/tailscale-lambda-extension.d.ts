declare module "tailscale-lambda-extension" {
  import type {
    LayerVersion,
    LayerVersionOptions,
  } from "aws-cdk-lib/aws-lambda";
  import type { Construct } from "constructs";

  export type TailscaleLambdaExtensionProps = {
    readonly options?: LayerVersionOptions;
  };

  export class TailscaleLambdaExtension extends Construct {
    public readonly layer: LayerVersion;
    constructor(
      scope: Construct,
      id: string,
      props?: TailscaleLambdaExtensionProps
    );
  }
}
