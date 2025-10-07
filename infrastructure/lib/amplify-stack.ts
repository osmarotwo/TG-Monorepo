import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface AmplifyStackProps extends cdk.StackProps {
  /**
   * GitHub repository URL for automatic deployment
   * Format: https://github.com/owner/repo
   */
  githubRepoUrl: string;
  
  /**
   * GitHub personal access token stored in SSM Parameter Store
   * Default path: /amplify/github-token
   */
  githubTokenParameterName?: string;
  
  /**
   * Main branch for production deployment
   * Default: main
   */
  mainBranch?: string;
  
  /**
   * Development branch for staging deployment
   * Default: develop
   */
  developBranch?: string;
  
  /**
   * API Gateway URL for frontend integration
   * This will be set as VITE_API_URL environment variable
   */
  apiGatewayUrl?: string;
}

export class AmplifyStack extends cdk.Stack {
  public readonly amplifyApp: amplify.CfnApp;
  public readonly mainBranch: amplify.CfnBranch;
  public readonly developBranch: amplify.CfnBranch;

  constructor(scope: Construct, id: string, props: AmplifyStackProps) {
    super(scope, id, props);

    const {
      githubRepoUrl,
      githubTokenParameterName = '/amplify/github-token',
      mainBranch = 'main',
      developBranch = 'develop',
      apiGatewayUrl
    } = props;

    // ====================
    // IAM Role for Amplify
    // ====================
    
    const amplifyRole = new iam.Role(this, 'AmplifyRole', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Role for AWS Amplify to access AWS services',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
      ],
    });

    // ====================
    // Get GitHub Token from SSM
    // ====================
    
    const githubToken = ssm.StringParameter.fromStringParameterName(
      this,
      'GitHubToken',
      githubTokenParameterName
    );

    // ====================
    // Amplify App
    // ====================
    
    this.amplifyApp = new amplify.CfnApp(this, 'FrontendApp', {
      name: 'TG-Frontend-App',
      description: 'Frontend Next.js application optimized for AWS Amplify',
      repository: githubRepoUrl,
      accessToken: githubToken.stringValue,
      iamServiceRole: amplifyRole.roleArn,
      
      // Environment variables para el frontend
      environmentVariables: [
        ...(apiGatewayUrl ? [{
          name: 'NEXT_PUBLIC_API_URL',
          value: apiGatewayUrl,
        }] : []),
        {
          name: 'NEXT_PUBLIC_APP_NAME',
          value: 'TG Platform',
        },
        {
          name: 'NEXT_PUBLIC_ENVIRONMENT',
          value: 'production',
        },
        {
          name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
          value: '816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com',
        }
      ],
      
      // Platform configuration - WEB para hosting estático clásico
      platform: 'WEB',
    });

    // ====================
    // Main Branch (Production)
    // ====================
    
    this.mainBranch = new amplify.CfnBranch(this, 'MainBranch', {
      appId: this.amplifyApp.attrAppId,
      branchName: mainBranch,
      description: 'Production branch for the frontend application',
      
      // Production environment variables
      environmentVariables: [
        ...(apiGatewayUrl ? [{
          name: 'NEXT_PUBLIC_API_URL',
          value: apiGatewayUrl,
        }] : []),
        {
          name: 'NEXT_PUBLIC_APP_NAME',
          value: 'TG Platform',
        },
        {
          name: 'NEXT_PUBLIC_ENVIRONMENT',
          value: 'production',
        },
        {
          name: 'NEXT_PUBLIC_APP_VERSION',
          value: '1.0.0',
        },
        {
          name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
          value: '816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com',
        }
      ],
      
      // Enable auto build
      enableAutoBuild: true,
      
      // Enable pull request preview
      enablePullRequestPreview: false, // Disabled for main branch
      
      // Stage configuration
      stage: 'PRODUCTION',
    });

    // ====================
    // Development Branch (Staging) 
    // ====================
    
    this.developBranch = new amplify.CfnBranch(this, 'DevelopBranch', {
      appId: this.amplifyApp.attrAppId,
      branchName: developBranch,
      description: 'Development/staging branch for testing',
      
      // Staging environment variables
      environmentVariables: [
        ...(apiGatewayUrl ? [{
          name: 'NEXT_PUBLIC_API_URL',
          value: apiGatewayUrl.replace('/prod', '/dev'), // Use dev stage if available
        }] : []),
        {
          name: 'NEXT_PUBLIC_APP_NAME',
          value: 'TG Platform (Staging)',
        },
        {
          name: 'NEXT_PUBLIC_ENVIRONMENT',
          value: 'staging',
        },
        {
          name: 'NEXT_PUBLIC_DEBUG',
          value: 'true',
        },
        {
          name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
          value: '816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com',
        }
      ],
      
      // Enable auto build
      enableAutoBuild: true,
      
      // Enable pull request preview
      enablePullRequestPreview: true,
      
      // Stage configuration
      stage: 'DEVELOPMENT',
    });

    // ====================
    // Domain Configuration (Optional)
    // ====================
    
    // Uncomment and configure if you have a custom domain
    /*
    const domain = new amplify.CfnDomainAssociation(this, 'Domain', {
      appId: this.amplifyApp.attrAppId,
      domainName: 'yourdomain.com',
      subDomainSettings: [
        {
          prefix: '',
          branchName: mainBranch,
        },
        {
          prefix: 'dev',
          branchName: developBranch,
        }
      ],
    });
    */

    // ====================
    // Outputs
    // ====================
    
    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: this.amplifyApp.attrAppId,
      description: 'Amplify App ID',
      exportName: 'AmplifyAppId',
    });

    new cdk.CfnOutput(this, 'AmplifyAppName', {
      value: this.amplifyApp.name || 'TG-Frontend-App',
      description: 'Amplify App Name',
    });

    new cdk.CfnOutput(this, 'ProductionUrl', {
      value: `https://${mainBranch}.${this.amplifyApp.attrAppId}.amplifyapp.com`,
      description: 'Production Frontend URL',
      exportName: 'ProductionFrontendUrl',
    });

    new cdk.CfnOutput(this, 'StagingUrl', {
      value: `https://${developBranch}.${this.amplifyApp.attrAppId}.amplifyapp.com`,
      description: 'Staging Frontend URL',
      exportName: 'StagingFrontendUrl',
    });

    new cdk.CfnOutput(this, 'AmplifyConsoleUrl', {
      value: `https://console.aws.amazon.com/amplify/home#/apps/${this.amplifyApp.attrAppId}`,
      description: 'AWS Amplify Console URL for this app',
    });

    // ====================
    // SSM Parameters for other stacks
    // ====================
    
    // Store Amplify App ID for reference by other stacks
    new ssm.StringParameter(this, 'AmplifyAppIdParameter', {
      parameterName: '/amplify/app-id',
      stringValue: this.amplifyApp.attrAppId,
      description: 'Amplify App ID for cross-stack references',
    });

    // Store production URL
    new ssm.StringParameter(this, 'ProductionUrlParameter', {
      parameterName: '/amplify/production-url',
      stringValue: `https://${mainBranch}.${this.amplifyApp.attrAppId}.amplifyapp.com`,
      description: 'Production frontend URL',
    });
  }
}