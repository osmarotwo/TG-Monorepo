/**
 * Script para actualizar el businessId de cada cita según su locationId
 * Mapeo correcto: cada location pertenece a un business específico
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const CLIENT_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';

// Mapeo: locationId → businessId (según las locations creadas)
const LOCATION_TO_BUSINESS: Record<string, string> = {
  'LOC-CENTRO-ZIP': 'BIZ-SALON-BELLEZA',
  'LOC-NORTE-ZIP': 'BIZ-PELUQUERIA-MODERNA',
  'LOC-SUR-ZIP': 'BIZ-SPA-RELAX',
  'LOC-ESTE-ZIP': 'BIZ-BARBERIA-CLASICA',
  'LOC-OESTE-ZIP': 'BIZ-ESTETICA-BELLA',
  'LOC-CATEDRAL-ZIP': 'BIZ-SALON-ELITE'
};

async function updateAppointmentBusinessIds() {
  console.log('═'.repeat(70));
  console.log('🔧 ACTUALIZANDO: BusinessId según LocationId');
  console.log('═'.repeat(70));
  console.log('\n📍 Mapeo Location → Business:');
  Object.entries(LOCATION_TO_BUSINESS).forEach(([loc, biz]) => {
    console.log(`   ${loc} → ${biz}`);
  });
  console.log('');

  // 1. Obtener todas las citas
  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${CLIENT_USER_ID}`
    }
  }));

  const appointments = scanResult.Items || [];
  console.log(`📊 Citas a actualizar: ${appointments.length}\n`);

  // 2. Actualizar cada cita
  for (const appointment of appointments) {
    const locationId = appointment.locationId;
    const correctBusinessId = LOCATION_TO_BUSINESS[locationId];

    if (!correctBusinessId) {
      console.log(`⚠️  ${appointment.SK}: Location ${locationId} no tiene business asignado`);
      continue;
    }

    console.log(`📝 ${appointment.SK}:`);
    console.log(`   Location: ${locationId}`);
    console.log(`   Business anterior: ${appointment.businessId}`);
    console.log(`   Business nuevo: ${correctBusinessId}`);

    await docClient.send(new UpdateCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: {
        PK: appointment.PK,
        SK: appointment.SK
      },
      UpdateExpression: 'SET businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': correctBusinessId
      }
    }));

    console.log(`   ✅ Actualizado\n`);
  }

  console.log('═'.repeat(70));
  console.log('✅ ACTUALIZACIÓN COMPLETADA');
  console.log('═'.repeat(70));
  console.log('\n📝 Ahora cada cita tiene el businessId correcto según su location\n');
}

updateAppointmentBusinessIds().catch(console.error);
