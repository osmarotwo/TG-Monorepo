import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const method = event.httpMethod;
  const path = event.path;
  const queryParams = event.queryStringParameters;
  const body = event.body;

  let message: string;
  let statusCode: number = 200;

  try {
    switch (method) {
      case 'GET':
        if (path === '/hello') {
          const name = queryParams?.name || 'World';
          message = `Hello, ${name}! This is from AWS Lambda via CDK.`;
        } else {
          message = 'Welcome to the AWS CDK API Gateway + Lambda demo!';
        }
        break;

      case 'POST':
        if (path === '/hello') {
          const requestBody = body ? JSON.parse(body) : {};
          const name = requestBody.name || 'World';
          message = `Hello, ${name}! This is a POST request response.`;
        } else {
          message = 'POST request received successfully.';
        }
        break;

      default:
        statusCode = 405;
        message = `Method ${method} not allowed`;
        break;
    }
  } catch (error) {
    console.error('Error processing request:', error);
    statusCode = 500;
    message = 'Internal server error';
  }

  const response: APIGatewayProxyResult = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({
      message,
      timestamp: new Date().toISOString(),
      path,
      method,
      requestId: event.requestContext.requestId,
    }),
  };

  console.log('Response:', JSON.stringify(response, null, 2));
  return response;
};