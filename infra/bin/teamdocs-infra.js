#!/usr/bin/env node
import "source-map-support/register.js";
import * as cdk from "aws-cdk-lib";
import { TeamdocsInfraStack } from "../lib/teamdocs-infra-stack.js";

const app = new cdk.App();

new TeamdocsInfraStack(app, "TeamdocsInfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
