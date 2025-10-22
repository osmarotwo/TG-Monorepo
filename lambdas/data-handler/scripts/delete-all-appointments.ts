/**
 * Script para BORRAR todas las citas de la tabla Appointments
 * Útil para limpiar y crear nuevo dataset de prueba
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';

async function deleteAllAppointments() {
  try {
    console.log('🗑️  Buscando todas las citas en la tabla Appointments...\n');

    // Scan para obtener todas las citas
    const scanResult = await docClient.send(new ScanCommand({
      TableName: APPOINTMENTS_TABLE,
      ProjectionExpression: 'PK, SK',
    }));

    const items = scanResult.Items || [];
    
    if (items.length === 0) {
      console.log('✅ No hay citas para borrar. La tabla está vacía.\n');
      return;
    }

    console.log(`📊 Encontradas ${items.length} citas para borrar...\n`);

    // DynamoDB BatchWrite soporta máximo 25 items por request
    const batchSize = 25;
    let deletedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK,
          }
        }
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [APPOINTMENTS_TABLE]: deleteRequests
        }
      }));

      deletedCount += deleteRequests.length;
      console.log(`   Borradas ${deletedCount}/${items.length} citas...`);
    }

    console.log(`\n✅ ${deletedCount} citas borradas exitosamente!\n`);
  } catch (error) {
    console.error('❌ Error borrando citas:', error);
    throw error;
  }
}

// Ejecutar
deleteAllAppointments()
  .then(() => {
    console.log('✨ Proceso completado exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en el proceso:', error);
    process.exit(1);
  });
