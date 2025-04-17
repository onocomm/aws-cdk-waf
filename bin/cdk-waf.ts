#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWafStack } from '../lib/cdk-waf-stack';

const app = new cdk.App();

new CdkWafStack(app, `CdkWafStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  }
});
