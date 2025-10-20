#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaStack } from '../lib/api-lambda-stack';
import { AuthStack } from '../lib/auth-stack';
import { AmplifyStack } from '../lib/amplify-stack';
import { DataStack } from '../lib/data-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: undefined,
  region: 'us-east-1',
};

// Original API Lambda Stack
const apiStack = new ApiLambdaStack(app, 'ApiLambdaStack', {
  env,
});

// Authentication Stack with serverless backend
const authStack = new AuthStack(app, 'AuthStack', {
  env,
});

// Data Stack for Dashboard (Appointments, Locations, Businesses, KPIs)
const dataStack = new DataStack(app, 'DataStack', {
  env,
});

// Frontend Amplify Stack
const amplifyStack = new AmplifyStack(app, 'AmplifyStack', {
  env,
  githubRepoUrl: 'https://github.com/osmarotwo/TG-Monorepo',
  githubTokenParameterName: '/auth/github-token',
  mainBranch: 'feature/frontend-user', // Using current branch as main for deployment
  developBranch: 'develop', // Future develop branch
  apiGatewayUrl: authStack.authApi.url, // Connect to auth API
});

// Add dependencies to ensure proper deployment order
amplifyStack.addDependency(authStack);
amplifyStack.addDependency(apiStack);
amplifyStack.addDependency(dataStack);