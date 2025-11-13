/**
 * Script para corregir locationIds en appointments existentes
 * Actualiza de LOC001-LOC005 a LOC-CENTRO-ZIP, LOC-SUR-ZIP, etc.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Mapeo de IDs viejos a nuevos
const LOCATION_ID_MAP: Record<string, string> = {
  'LOC001': 'LOC-CENTRO-ZIP',
  'LOC002': 'LOC-SUR-ZIP',
  'LOC003': 'LOC-NORTE-ZIP',
  'LOC004': 'LOC-OESTE-ZIP',
  'LOC005': 'LOC-ESTE-ZIP',
};

async function fixAppointmentLocationIds() {
  console.log('🔍 Escaneando appointments con locationIds viejos...\n');

  // Escanear appointments
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: 'Appointments',
      FilterExpression: 'attribute_exists(locationId)',
    })
  );

  const items = scanResult.Items || [];
  console.log(`📋 Total appointments encontrados: ${items.length}\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const { PK, SK, locationId } = item;
    
    // Verificar si el locationId necesita actualización
    if (locationId && LOCATION_ID_MAP[locationId]) {
      const newLocationId = LOCATION_ID_MAP[locationId];
      
      console.log(`🔄 Actualizando appointment ${item.appointmentId || SK}`);
      console.log(`   Viejo: ${locationId} → Nuevo: ${newLocationId}`);

      try {
        await docClient.send(
          new UpdateCommand({
            TableName: 'Appointments',
            Key: { PK, SK },
            UpdateExpression: 'SET locationId = :newLocationId',
            ExpressionAttributeValues: {
              ':newLocationId': newLocationId,
            },
          })
        );

        updatedCount++;
        console.log(`   ✅ Actualizado\n`);
      } catch (error) {
        console.error(`   ❌ Error actualizando:`, error);
      }
    } else {
      skippedCount++;
      console.log(`⏭️  Saltando appointment ${item.appointmentId || SK} (locationId: ${locationId})`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumen:');
  console.log(`   ✅ Actualizados: ${updatedCount}`);
  console.log(`   ⏭️  Saltados (ya correctos): ${skippedCount}`);
  console.log('='.repeat(50));
}

// Ejecutar
fixAppointmentLocationIds()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
