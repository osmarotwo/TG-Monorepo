import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = 'Availability';

async function deleteAllItems() {
  console.log('🗑️ Scanning for items to delete...');
  
  const scanResult = await docClient.send(new ScanCommand({
    TableName: AVAILABILITY_TABLE,
    FilterExpression: 'businessId = :bid',
    ExpressionAttributeValues: {
      ':bid': 'BIZ001'
    },
    ProjectionExpression: 'PK, SK'
  }));
  
  const items = scanResult.Items || [];
  console.log(`📊 Found ${items.length} items to delete`);
  
  if (items.length === 0) {
    console.log('✅ No items to delete');
    return;
  }
  
  // Delete in batches of 25
  const chunks: any[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }
  
  console.log(`📦 Deleting in ${chunks.length} batches...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [AVAILABILITY_TABLE]: chunk.map(item => ({
          DeleteRequest: { Key: { PK: item.PK, SK: item.SK } }
        }))
      }
    }));
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ Progress: ${i + 1}/${chunks.length} batches`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ All items deleted!');
}

deleteAllItems().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
