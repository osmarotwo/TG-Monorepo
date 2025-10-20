import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const dynamodb = docClient;

/**
 * Query items from DynamoDB table
 */
export async function queryItems(params: {
  tableName: string;
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
  indexName?: string;
  limit?: number;
  scanIndexForward?: boolean;
}) {
  const command = new QueryCommand({
    TableName: params.tableName,
    KeyConditionExpression: params.keyConditionExpression,
    ExpressionAttributeValues: params.expressionAttributeValues,
    ExpressionAttributeNames: params.expressionAttributeNames,
    IndexName: params.indexName,
    Limit: params.limit,
    ScanIndexForward: params.scanIndexForward,
  });

  const response = await docClient.send(command);
  return response.Items || [];
}

/**
 * Get single item from DynamoDB
 */
export async function getItem(tableName: string, key: Record<string, any>) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });

  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Put item to DynamoDB
 */
export async function putItem(tableName: string, item: Record<string, any>) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await docClient.send(command);
  return item;
}

/**
 * Scan table (use sparingly, prefer query)
 */
export async function scanTable(tableName: string, limit?: number) {
  const command = new ScanCommand({
    TableName: tableName,
    Limit: limit,
  });

  const response = await docClient.send(command);
  return response.Items || [];
}
