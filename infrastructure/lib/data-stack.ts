import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class DataStack extends cdk.Stack {
  public readonly dataApi: apigateway.RestApi;
  public readonly appointmentsTable: dynamodb.Table;
  public readonly businessesTable: dynamodb.Table;
  public readonly locationsTable: dynamodb.Table;
  public readonly kpisTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ====================
    // DynamoDB Tables
    // ====================

    // Appointments Table
    this.appointmentsTable = new dynamodb.Table(this, 'AppointmentsTable', {
      tableName: 'Appointments',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para desarrollo
      pointInTimeRecovery: true,
    });

    // GSI1: Query appointments by userId
    this.appointmentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // GSI2: Query appointments by locationId
    this.appointmentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // GSI3: Query appointments by businessId and status
    this.appointmentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
    });

    // Businesses Table
    this.businessesTable = new dynamodb.Table(this, 'BusinessesTable', {
      tableName: 'Businesses',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // GSI1: Query businesses by ownerId
    this.businessesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // Locations Table
    this.locationsTable = new dynamodb.Table(this, 'LocationsTable', {
      tableName: 'Locations',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // GSI1: Query locations by businessId
    this.locationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // GSI2: Query locations by city (geo search)
    this.locationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // KPIs Table
    this.kpisTable = new dynamodb.Table(this, 'KPIsTable', {
      tableName: 'KPIs',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      
      // TTL for old metrics (optional, uncomment if needed)
      // timeToLiveAttribute: 'ttl',
    });

    // ====================
    // Lambda Function
    // ====================

    const dataHandler = new lambda.Function(this, 'DataHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambdas/data-handler/dist'),
      environment: {
        APPOINTMENTS_TABLE: this.appointmentsTable.tableName,
        BUSINESSES_TABLE: this.businessesTable.tableName,
        LOCATIONS_TABLE: this.locationsTable.tableName,
        KPIS_TABLE: this.kpisTable.tableName,
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Grant DynamoDB permissions
    this.appointmentsTable.grantReadWriteData(dataHandler);
    this.businessesTable.grantReadWriteData(dataHandler);
    this.locationsTable.grantReadWriteData(dataHandler);
    this.kpisTable.grantReadWriteData(dataHandler);

    // ====================
    // API Gateway
    // ====================

    this.dataApi = new apigateway.RestApi(this, 'DataApi', {
      restApiName: 'Clyok Data Service',
      description: 'API Gateway for Clyok Dashboard data (appointments, locations, businesses, KPIs)',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Lambda integration
    const dataIntegration = new apigateway.LambdaIntegration(dataHandler);

    // Create /api resource
    const apiResource = this.dataApi.root.addResource('api');

    // Appointments routes
    const appointmentsResource = apiResource.addResource('appointments');
    appointmentsResource.addMethod('GET', dataIntegration); // GET /api/appointments
    const appointmentByIdResource = appointmentsResource.addResource('{id}');
    appointmentByIdResource.addMethod('GET', dataIntegration); // GET /api/appointments/{id}

    // Locations routes
    const locationsResource = apiResource.addResource('locations');
    locationsResource.addMethod('GET', dataIntegration); // GET /api/locations
    const locationByIdResource = locationsResource.addResource('{id}');
    locationByIdResource.addMethod('GET', dataIntegration); // GET /api/locations/{id}

    // Businesses routes
    const businessesResource = apiResource.addResource('businesses');
    businessesResource.addMethod('GET', dataIntegration); // GET /api/businesses
    const businessByIdResource = businessesResource.addResource('{id}');
    businessByIdResource.addMethod('GET', dataIntegration); // GET /api/businesses/{id}

    // KPIs routes
    const kpisResource = apiResource.addResource('kpis');
    const kpisByLocationResource = kpisResource.addResource('{locationId}');
    kpisByLocationResource.addMethod('GET', dataIntegration); // GET /api/kpis/{locationId}

    // ====================
    // Outputs
    // ====================

    new cdk.CfnOutput(this, 'DataApiUrl', {
      value: this.dataApi.url,
      description: 'URL of the Data API Gateway',
      exportName: 'ClyokDataApiUrl',
    });

    new cdk.CfnOutput(this, 'AppointmentsTableName', {
      value: this.appointmentsTable.tableName,
      description: 'Name of Appointments DynamoDB table',
    });

    new cdk.CfnOutput(this, 'BusinessesTableName', {
      value: this.businessesTable.tableName,
      description: 'Name of Businesses DynamoDB table',
    });

    new cdk.CfnOutput(this, 'LocationsTableName', {
      value: this.locationsTable.tableName,
      description: 'Name of Locations DynamoDB table',
    });

    new cdk.CfnOutput(this, 'KPIsTableName', {
      value: this.kpisTable.tableName,
      description: 'Name of KPIs DynamoDB table',
    });

    new cdk.CfnOutput(this, 'DataHandlerArn', {
      value: dataHandler.functionArn,
      description: 'ARN of the Data Handler Lambda function',
    });
  }
}
