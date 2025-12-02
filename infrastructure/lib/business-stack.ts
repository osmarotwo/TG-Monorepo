import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface BusinessStackProps extends cdk.StackProps {
  apiId: string;
  rootResourceId: string;
  appointmentsTableArn: string;
  appointmentsTableName: string;
  usersTableArn: string;
  usersTableName: string;
  locationsTableArn: string;
  locationsTableName: string;
  availabilityTableArn: string;
  availabilityTableName: string;
}

export class BusinessStack extends cdk.Stack {
  public readonly businessAppointmentsHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: BusinessStackProps) {
    super(scope, id, props);

    const {
      apiId,
      rootResourceId,
      appointmentsTableArn,
      appointmentsTableName,
      usersTableArn,
      usersTableName,
      locationsTableArn,
      locationsTableName,
      availabilityTableArn,
      availabilityTableName,
    } = props;

    // Import existing API Gateway
    const authApi = apigateway.RestApi.fromRestApiAttributes(this, 'ImportedAuthApi', {
      restApiId: apiId,
      rootResourceId: rootResourceId,
    });

    // Import existing tables
    const appointmentsTable = dynamodb.Table.fromTableArn(this, 'ImportedAppointmentsTable', appointmentsTableArn);
    const usersTable = dynamodb.Table.fromTableArn(this, 'ImportedUsersTable', usersTableArn);
    const locationsTable = dynamodb.Table.fromTableArn(this, 'ImportedLocationsTable', locationsTableArn);
    const availabilityTable = dynamodb.Table.fromTableArn(this, 'ImportedAvailabilityTable', availabilityTableArn);

    // ====================
    // Lambda Functions
    // ====================

    // Business Appointments Handler
    this.businessAppointmentsHandler = new lambda.Function(this, 'BusinessAppointmentsHandler', {
      functionName: 'BusinessAppointmentsHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('../lambdas/business-appointments-handler/dist'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        APPOINTMENTS_TABLE: appointmentsTableName,
        USERS_TABLE: usersTableName,
        LOCATIONS_TABLE: locationsTableName,
        JWT_SECRET_PARAM: '/tg-om/jwt-secret',
        FRONTEND_URL: this.node.tryGetContext('frontendUrl') || '*',
      },
    });

    // Grant permissions to Business Appointments Handler
    appointmentsTable.grantReadData(this.businessAppointmentsHandler);
    usersTable.grantReadData(this.businessAppointmentsHandler);
    locationsTable.grantReadData(this.businessAppointmentsHandler);

    // Grant SSM parameter access for JWT verification
    this.businessAppointmentsHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/tg-om/jwt-secret`
      ],
    }));

    // ====================
    // API Gateway Integration
    // ====================

    // Add /appointments resource (will create if not exists)
    const appointmentsResource = authApi.root.addResource('appointments', {
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

    // Add /appointments/business resource
    const businessResource = appointmentsResource.addResource('business', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'OPTIONS'],
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

    // Add /appointments/business/{businessId} resource
    const businessIdResource = businessResource.addResource('{businessId}', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'OPTIONS'],
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

    const businessAppointmentsIntegration = new apigateway.LambdaIntegration(this.businessAppointmentsHandler);

    // GET /appointments/business/{businessId} - Get all appointments for a business
    businessIdResource.addMethod('GET', businessAppointmentsIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // ====================
    // Outputs
    // ====================

    new cdk.CfnOutput(this, 'BusinessAppointmentsHandlerArn', {
      value: this.businessAppointmentsHandler.functionArn,
      description: 'Business Appointments Lambda function ARN',
    });
  }
}
