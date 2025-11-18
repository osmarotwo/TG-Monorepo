/**
 * Script para limpiar datos de disponibilidad incorrectos
 * Elimina todos los registros de disponibilidad para regenerarlos correctamente
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = 'Availability';

async function deleteAllAvailability() {
  console.log('🗑️  Eliminando toda la disponibilidad existente...\n');
  
  try {
    // Escanear todos los items
    const result = await docClient.send(new ScanCommand({
      TableName: AVAILABILITY_TABLE
    }));
    
    const items = result.Items || [];
    console.log(`📊 Items encontrados: ${items.length}`);
    
    if (items.length === 0) {
      console.log('✅ No hay datos para eliminar');
      return;
    }
    
    // Eliminar en lotes de 25 (límite de DynamoDB)
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }
    
    console.log(`📦 Eliminando en ${batches.length} lotes...\n`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [AVAILABILITY_TABLE]: batch.map(item => ({
            DeleteRequest: {
              Key: {
                PK: item.PK,
                SK: item.SK
              }
            }
          }))
        }
      }));
      
      console.log(`   Lote ${i + 1}/${batches.length} eliminado (${batch.length} items)`);
    }
    
    console.log(`\n✅ ${items.length} registros eliminados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

deleteAllAvailability()
  .then(() => {
    console.log('\n🎯 Disponibilidad limpiada. Ahora puedes regenerarla correctamente.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
