import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkAppointment() {
  const result = await docClient.send(new QueryCommand({
    TableName: 'Appointments',
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': 'USER#5fabb21e-3722-43ab-b491-5e53a45f9616',
      ':sk': 'APPOINTMENT#2025-11-18'
    }
  }));
  
  if (result.Items && result.Items.length > 0) {
    console.log('📋 Cita encontrada:');
    console.log(JSON.stringify(result.Items[0], null, 2));
  } else {
    console.log('❌ No se encontró ninguna cita');
  }
}

checkAppointment();
