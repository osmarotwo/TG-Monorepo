import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  public readonly authApi: apigateway.RestApi;
  public readonly usersTable: dynamodb.Table;
  public readonly sessionsTable: dynamodb.Table;
  public readonly emailVerificationsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ====================
    // DynamoDB Tables
    // ====================

    // Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para desarrollo
      pointInTimeRecovery: true,
    });

    // Add Global Secondary Indexes to Users Table
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI2', 
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // Sessions Table
    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'Sessions',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      
      // TTL for automatic cleanup
      timeToLiveAttribute: 'ttl',
    });

    // Add Global Secondary Index to Sessions Table
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'UserSessionsIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // Email Verifications Table
    this.emailVerificationsTable = new dynamodb.Table(this, 'EmailVerificationsTable', {
      tableName: 'EmailVerifications',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      
      // TTL for automatic cleanup (24 hours)
      timeToLiveAttribute: 'ttl',
    });

    // ====================
    // Lambda Functions
    // ====================

    // Common environment variables
    const commonEnvironment = {
      USERS_TABLE: this.usersTable.tableName,
      SESSIONS_TABLE: this.sessionsTable.tableName,
      EMAIL_VERIFICATIONS_TABLE: this.emailVerificationsTable.tableName,
      JWT_SECRET: '{{resolve:ssm:/auth/jwt-secret:1}}', // From SSM Parameter Store
      GOOGLE_CLIENT_ID: '{{resolve:ssm:/auth/google-client-id:1}}',
      BCRYPT_ROUNDS: '12',
      TOKEN_EXPIRY: '1h',
      REFRESH_TOKEN_EXPIRY: '30d',
      NODE_ENV: 'production',
    };

    // JWT Authorizer Lambda
    const jwtAuthorizer = new lambda.Function(this, 'JwtAuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/authorizer.handler',
      code: lambda.Code.fromAsset('../lambdas/jwt-authorizer'),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    // Auth Handler Lambda  
    const authHandler = new lambda.Function(this, 'AuthHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset('../lambdas/auth-handler'),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // ====================
    // IAM Permissions
    // ====================

    // Grant DynamoDB permissions to Auth Handler
    this.usersTable.grantReadWriteData(authHandler);
    this.sessionsTable.grantReadWriteData(authHandler);
    this.emailVerificationsTable.grantReadWriteData(authHandler);

    // Grant DynamoDB read permissions to JWT Authorizer
    this.sessionsTable.grantReadData(jwtAuthorizer);
    this.usersTable.grantReadData(jwtAuthorizer);

    // Grant SSM parameter access
    const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/auth/*`
      ],
    });

    authHandler.addToRolePolicy(ssmPolicy);
    jwtAuthorizer.addToRolePolicy(ssmPolicy);

    // ====================
    // API Gateway
    // ====================

    // Create API Gateway
    this.authApi = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: 'Authentication API',
      description: 'Serverless authentication API with JWT',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date', 
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
      },
    });

    // Create Custom Authorizer
    const customAuthorizer = new apigateway.RequestAuthorizer(this, 'JwtAuthorizer', {
      handler: jwtAuthorizer,
      identitySources: [apigateway.IdentitySource.header('Authorization')],
      authorizerName: 'JwtAuthorizer',
      resultsCacheTtl: cdk.Duration.minutes(5), // Cache for 5 minutes
    });

    // Create integrations
    const authIntegration = new apigateway.LambdaIntegration(authHandler);

    // ====================
    // API Routes
    // ====================

    // Auth resource
    const authResource = this.authApi.root.addResource('auth');

    // Public routes (no authentication required)
    const googleResource = authResource.addResource('google');
    googleResource.addMethod('POST', authIntegration);

    const registerResource = authResource.addResource('register'); 
    registerResource.addMethod('POST', authIntegration);

    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', authIntegration);

    const refreshResource = authResource.addResource('refresh');
    refreshResource.addMethod('POST', authIntegration);

    const verifyEmailResource = authResource.addResource('verify-email');
    verifyEmailResource.addMethod('POST', authIntegration);

    const forgotPasswordResource = authResource.addResource('forgot-password');
    forgotPasswordResource.addMethod('POST', authIntegration);

    const resetPasswordResource = authResource.addResource('reset-password');
    resetPasswordResource.addMethod('POST', authIntegration);

    // Protected routes (require JWT authentication)
    const completeProfileResource = authResource.addResource('complete-profile');
    completeProfileResource.addMethod('POST', authIntegration, {
      authorizer: customAuthorizer,
    });

    const meResource = authResource.addResource('me');
    meResource.addMethod('GET', authIntegration, {
      authorizer: customAuthorizer,
    });

    const logoutResource = authResource.addResource('logout');
    logoutResource.addMethod('POST', authIntegration, {
      authorizer: customAuthorizer,
    });

    const profileResource = authResource.addResource('profile');
    profileResource.addMethod('PUT', authIntegration, {
      authorizer: customAuthorizer,
    });

    // ====================
    // Outputs
    // ====================

    new cdk.CfnOutput(this, 'AuthApiUrl', {
      value: this.authApi.url,
      description: 'URL of the Authentication API',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Name of the Users DynamoDB table',
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: this.sessionsTable.tableName,
      description: 'Name of the Sessions DynamoDB table',
    });

    new cdk.CfnOutput(this, 'EmailVerificationsTableName', {
      value: this.emailVerificationsTable.tableName,
      description: 'Name of the Email Verifications DynamoDB table',
    });
  }
}