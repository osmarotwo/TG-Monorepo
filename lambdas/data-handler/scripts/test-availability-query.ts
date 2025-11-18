import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function testAvailabilityQuery() {
  console.log('🔍 Probando query de disponibilidad (como lo hace el endpoint)...\n');
  
  const locationId = 'LOC001';
  const date = '2025-11-18';
  
  console.log(`Parámetros:`);
  console.log(`  Location: ${locationId}`);
  console.log(`  Date: ${date}`);
  console.log(`  GSI1PK: DATE#${date}#LOCATION#${locationId}`);
  console.log(`  GSI1SK prefix: SPECIALIST#`);
  console.log('');
  
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: 'Availability',
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DATE#${date}#LOCATION#${locationId}`,
        ':sk': 'SPECIALIST#'
      }
    }));
    
    console.log(`📊 Resultados encontrados: ${result.Items?.length || 0}\n`);
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach((item, index) => {
        console.log(`${index + 1}. Especialista: ${item.specialistName}`);
        console.log(`   ID: ${item.specialistId}`);
        console.log(`   Location: ${item.locationId}`);
        console.log(`   Fecha: ${item.date}`);
        console.log(`   Slots disponibles: ${Object.values(item.availability || {}).filter(v => v === 'available').length}`);
        
        // Mostrar primeros 5 slots disponibles
        const availSlots = Object.entries(item.availability || {})
          .filter(([_, status]) => status === 'available')
          .slice(0, 5)
          .map(([time]) => time);
        console.log(`   Ej: ${availSlots.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron agendas de especialistas');
      console.log('Esto significa que el frontend no podrá mostrar horarios disponibles.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAvailabilityQuery()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
