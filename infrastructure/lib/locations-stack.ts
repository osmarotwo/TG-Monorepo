import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface LocationsStackProps extends cdk.StackProps {
  apiId: string;
  rootResourceId: string;
  usersTableArn: string;
  usersTableName: string;
}

export class LocationsStack extends cdk.Stack {
  public readonly locationsTable: dynamodb.Table;
  public readonly locationsHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: LocationsStackProps) {
    super(scope, id, props);

    const { apiId, rootResourceId, usersTableArn, usersTableName } = props;

    // Import existing API Gateway
    const authApi = apigateway.RestApi.fromRestApiAttributes(this, 'ImportedAuthApi', {
      restApiId: apiId,
      rootResourceId: rootResourceId,
    });

    // Import existing Users table
    const usersTable = dynamodb.Table.fromTableArn(this, 'ImportedUsersTable', usersTableArn);

    // ====================
    // DynamoDB Table
    // ====================

    // Locations Table
    this.locationsTable = new dynamodb.Table(this, 'LocationsTable', {
      tableName: 'Locations',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para desarrollo
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Add Global Secondary Index for querying by locationId
    this.locationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // ====================
    // Lambda Function
    // ====================

    this.locationsHandler = new lambda.Function(this, 'LocationsHandler', {
      functionName: 'LocationsHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('../lambdas/locations-handler/deployment'),
      handler: 'dist/index.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        LOCATIONS_TABLE: this.locationsTable.tableName,
        USERS_TABLE: usersTableName,
        JWT_SECRET_PARAM: '/tg-om/jwt-secret',
        FRONTEND_URL: this.node.tryGetContext('frontendUrl') || '*',
      },
    });

    // Grant permissions
    this.locationsTable.grantReadWriteData(this.locationsHandler);
    usersTable.grantReadData(this.locationsHandler);

    // Grant SSM parameter access for JWT verification
    this.locationsHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/tg-om/jwt-secret`
      ],
    }));

    // ====================
    // API Gateway Integration
    // ====================

    // Add /locations resource
    const locationsResource = authApi.root.addResource('locations', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowCredentials: true,
      }
    });
    const locationIntegration = new apigateway.LambdaIntegration(this.locationsHandler);

    // POST /locations - Create location
    locationsResource.addMethod('POST', locationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // GET /locations - List all locations for business
    locationsResource.addMethod('GET', locationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Add /locations/{id} resource
    const locationIdResource = locationsResource.addResource('{id}', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowCredentials: true,
      }
    });

    // GET /locations/{id} - Get single location
    locationIdResource.addMethod('GET', locationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // PUT /locations/{id} - Update location
    locationIdResource.addMethod('PUT', locationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // DELETE /locations/{id} - Delete location
    locationIdResource.addMethod('DELETE', locationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // ====================
    // Outputs
    // ====================

    new cdk.CfnOutput(this, 'LocationsTableName', {
      value: this.locationsTable.tableName,
      description: 'Locations DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'LocationsHandlerArn', {
      value: this.locationsHandler.functionArn,
      description: 'Locations Lambda function ARN',
    });
  }
}
