#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaStack } from '../lib/api-lambda-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();

// Original API Lambda Stack
new ApiLambdaStack(app, 'ApiLambdaStack', {
  env: {
    // Specify the AWS account and region if needed
    // account: process.env.CDK_DEFAULT_ACCOUNT,
    // region: process.env.CDK_DEFAULT_REGION,
  },
});

// New Authentication Stack
new AuthStack(app, 'AuthStack', {
  env: {
    // account: process.env.CDK_DEFAULT_ACCOUNT,
    // region: process.env.CDK_DEFAULT_REGION,
  },
});