import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkServices() {
  console.log('🔍 Verificando servicios registrados...\n');
  
  const result = await docClient.send(new ScanCommand({
    TableName: 'Availability',
    FilterExpression: 'begins_with(PK, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': 'SERVICE#'
    }
  }));
  
  console.log(`📊 Servicios encontrados: ${result.Items?.length || 0}\n`);
  
  if (result.Items && result.Items.length > 0) {
    result.Items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.displayName || item.serviceType}`);
      console.log(`   Tipo: ${item.serviceType}`);
      console.log(`   Duración: ${item.durationMinutes} minutos`);
      console.log(`   Precio: $${item.basePrice?.toLocaleString() || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('❌ No se encontraron servicios');
  }
}

checkServices()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
