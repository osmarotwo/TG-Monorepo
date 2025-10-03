import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ApiLambdaStack } from '../lib/api-lambda-stack';

test('Lambda Function Created', () => {
  const app = new cdk.App();
  const stack = new ApiLambdaStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x',
    Handler: 'index.handler',
  });
});

test('API Gateway Created', () => {
  const app = new cdk.App();
  const stack = new ApiLambdaStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'Hello Service',
  });
});

test('Stack Outputs Created', () => {
  const app = new cdk.App();
  const stack = new ApiLambdaStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  const outputs = template.findOutputs('*');
  expect(Object.keys(outputs)).toEqual(
    expect.arrayContaining(['ApiUrl', 'LambdaArn'])
  );
});