/**
 * Script para verificar el estado actual de las appointments
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const CLIENT_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';

async function checkAppointments() {
  console.log('═'.repeat(70));
  console.log('🔍 VERIFICANDO: Estado actual de Appointments');
  console.log('═'.repeat(70));

  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${CLIENT_USER_ID}`
    }
  }));

  const appointments = scanResult.Items || [];
  console.log(`\n📊 Citas encontradas: ${appointments.length}\n`);

  appointments.forEach((apt, i) => {
    console.log(`${i + 1}. ${apt.SK}`);
    console.log(`   Business ID: ${apt.businessId || 'NO DEFINIDO'}`);
    console.log(`   Location ID: ${apt.locationId || 'NO DEFINIDO'}`);
    console.log(`   Service: ${apt.serviceName || 'NO DEFINIDO'}`);
    console.log(`   Time: ${apt.time || 'NO DEFINIDO'}`);
    console.log(`   Client: ${apt.clientName || 'NO DEFINIDO'}`);
    console.log(`   Specialist: ${apt.specialistName || 'NO DEFINIDO'}`);
    console.log('');
  });
}

checkAppointments().catch(console.error);
