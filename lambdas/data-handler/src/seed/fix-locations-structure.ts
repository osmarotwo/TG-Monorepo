/**
 * Script para corregir la estructura de locations con PK incorrecta
 * Cambia de PK=LOCATION#{locationId} a PK=BUSINESS#{businessId}
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function fixLocationsStructure() {
  console.log('🔍 Escaneando locations con estructura incorrecta...\n');

  // Escanear locations con PK que comienza con LOCATION#
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: 'Locations',
      FilterExpression: 'begins_with(PK, :pk)',
      ExpressionAttributeValues: {
        ':pk': 'LOCATION#',
      },
    })
  );

  const items = scanResult.Items || [];
  console.log(`📋 Total locations con estructura incorrecta: ${items.length}\n`);

  if (items.length === 0) {
    console.log('✅ No hay locations que necesiten corrección');
    return;
  }

  let fixedCount = 0;

  for (const item of items) {
    const { locationId, businessId, PK, SK } = item;
    
    console.log(`🔄 Corrigiendo location: ${locationId} (${item.name})`);
    console.log(`   Business: ${businessId}`);
    console.log(`   PK vieja: ${PK} → PK nueva: BUSINESS#${businessId}`);
    console.log(`   SK vieja: ${SK} → SK nueva: LOCATION#${locationId}`);

    try {
      // 1. Eliminar el item viejo
      await docClient.send(
        new DeleteCommand({
          TableName: 'Locations',
          Key: { PK, SK },
        })
      );

      // 2. Crear item con estructura correcta
      const newItem = {
        ...item,
        PK: `BUSINESS#${businessId}`,
        SK: `LOCATION#${locationId}`,
        GSI1PK: `LOCATION#${locationId}`,
        GSI1SK: `BUSINESS#${businessId}`,
      };

      await docClient.send(
        new PutCommand({
          TableName: 'Locations',
          Item: newItem,
        })
      );

      fixedCount++;
      console.log(`   ✅ Corregida\n`);
    } catch (error) {
      console.error(`   ❌ Error corrigiendo:`, error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumen:');
  console.log(`   ✅ Locations corregidas: ${fixedCount}`);
  console.log('='.repeat(50));
}

// Ejecutar
fixLocationsStructure()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
