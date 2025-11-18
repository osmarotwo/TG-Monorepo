/**
 * Script para listar y BORRAR todas las citas de la tabla Appointments
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';

async function listAndDeleteAppointments() {
  try {
    console.log('🔍 Buscando todas las citas en la tabla Appointments...\n');

    // Scan para obtener todas las citas
    const scanResult = await docClient.send(new ScanCommand({
      TableName: APPOINTMENTS_TABLE,
    }));

    const items = scanResult.Items || [];
    
    if (items.length === 0) {
      console.log('✅ No hay citas en la tabla. La tabla está vacía.\n');
      return;
    }

    console.log(`📋 Encontradas ${items.length} citas:\n`);
    
    // Mostrar detalle de cada cita
    items.forEach((item, index) => {
      const type = item.type || 'business';
      const title = item.title || item.serviceType || 'Sin título';
      const time = item.time || item.startTime || 'Sin hora';
      const location = item.location || item.locationName || 'Sin ubicación';
      
      console.log(`${index + 1}. [${type.toUpperCase()}] ${title}`);
      console.log(`   📍 ${location}`);
      console.log(`   🕐 ${time}`);
      console.log(`   🔑 PK: ${item.PK}, SK: ${item.SK}`);
      console.log('');
    });

    // Agrupar por tipo
    const personal = items.filter(i => i.type === 'personal');
    const business = items.filter(i => i.type !== 'personal');
    
    console.log(`📊 Resumen:`);
    console.log(`   - Citas personales: ${personal.length}`);
    console.log(`   - Citas de negocio: ${business.length}`);
    console.log(`   - Total: ${items.length}\n`);

    // Preguntar confirmación (simulado - en script real elimina directamente)
    console.log('🗑️  Procediendo a eliminar todas las citas...\n');

    // Batch delete (máximo 25 items por batch)
    const batchSize = 25;
    let deleted = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [APPOINTMENTS_TABLE]: batch.map(item => ({
            DeleteRequest: {
              Key: {
                PK: item.PK,
                SK: item.SK,
              },
            },
          })),
        },
      }));

      deleted += batch.length;
      console.log(`   ✓ Eliminadas ${deleted}/${items.length} citas`);
    }

    console.log(`\n✅ Todas las citas han sido eliminadas exitosamente.`);
    console.log(`\n🧪 Ahora puedes hacer la prueba desde el UI:`);
    console.log(`   1. Crea una cita personal a las 11:30`);
    console.log(`   2. Intenta reservar una cita de negocio a las 11:30`);
    console.log(`   3. El sistema debe BLOQUEAR el horario (no debe aparecer disponible)\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar
listAndDeleteAppointments()
  .then(() => {
    console.log('✨ Proceso completado exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
