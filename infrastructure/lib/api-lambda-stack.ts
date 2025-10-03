import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ApiLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Lambda function
    const helloLambda = new lambda.Function(this, 'HelloLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset('../lambdas/api-handler'),
      environment: {
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'HelloApi', {
      restApiName: 'Hello Service',
      description: 'API Gateway for Hello Lambda function',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Create Lambda integration
    const helloIntegration = new apigateway.LambdaIntegration(helloLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add GET method to root path
    api.root.addMethod('GET', helloIntegration);

    // Add a hello resource with GET method
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod('GET', helloIntegration);

    // Add a hello resource with POST method
    helloResource.addMethod('POST', helloIntegration);

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the API Gateway',
    });

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, 'LambdaArn', {
      value: helloLambda.functionArn,
      description: 'ARN of the Lambda function',
    });
  }
}