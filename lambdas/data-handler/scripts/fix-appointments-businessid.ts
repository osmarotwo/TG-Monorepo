/**
 * Script para actualizar el businessId de todas las citas a BIZ-001
 * Esto corrige el error 404 cuando el dashboard intenta cargar los negocios
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const LOCATIONS_TABLE = 'Locations';
const CORRECT_BUSINESS_ID = 'BIZ-001';

async function fixAppointments() {
  console.log('═'.repeat(70));
  console.log('🔧 FIXING: Corrigiendo businessId en Appointments');
  console.log('═'.repeat(70));

  // 1. Escanear todas las citas
  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: 'begins_with(PK, :userPrefix)',
    ExpressionAttributeValues: {
      ':userPrefix': 'USER#'
    }
  }));

  console.log(`\n📊 Citas encontradas: ${scanResult.Items?.length || 0}\n`);

  // 2. Actualizar cada cita
  for (const item of scanResult.Items || []) {
    console.log(`📝 Actualizando ${item.SK}...`);
    
    await docClient.send(new UpdateCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: {
        PK: item.PK,
        SK: item.SK
      },
      UpdateExpression: 'SET businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': CORRECT_BUSINESS_ID
      }
    }));

    console.log(`   ✅ ${item.SK} → businessId: ${CORRECT_BUSINESS_ID}`);
  }
}

async function fixLocations() {
  console.log('\n═'.repeat(70));
  console.log('🔧 FIXING: Recreando Locations con businessId correcto');
  console.log('═'.repeat(70));

  // 1. Eliminar todas las locations existentes
  const scanResult = await docClient.send(new ScanCommand({
    TableName: LOCATIONS_TABLE
  }));

  console.log(`\n📊 Locations existentes: ${scanResult.Items?.length || 0}`);
  console.log('🗑️ Eliminando locations antiguas...\n');

  for (const item of scanResult.Items || []) {
    await docClient.send(new DeleteCommand({
      TableName: LOCATIONS_TABLE,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));
    console.log(`   ❌ Eliminada: ${item.SK}`);
  }

  // 2. Crear nuevas locations con businessId correcto
  const LOCATIONS = [
    {
      locationId: 'LOC-CENTRO-ZIP',
      name: 'Sede Centro',
      address: 'Cra 7 #3-45, Centro, Zipaquirá',
      latitude: 5.0214,
      longitude: -73.9919,
      serviceTypes: ['Corte de cabello', 'Manicure', 'Pedicure', 'Tinte']
    },
    {
      locationId: 'LOC-NORTE-ZIP',
      name: 'Sede Norte',
      address: 'Calle 10 #8-32, Barrio San Juanito, Zipaquirá',
      latitude: 5.0345,
      longitude: -73.9850,
      serviceTypes: ['Keratina', 'Tinte', 'Corte de cabello', 'Balayage']
    },
    {
      locationId: 'LOC-SUR-ZIP',
      name: 'Sede Sur',
      address: 'Carrera 5 #1-80, Barrio La Fraguita, Zipaquirá',
      latitude: 5.0100,
      longitude: -73.9980,
      serviceTypes: ['Masaje', 'Facial', 'Manicure', 'Pedicure']
    },
    {
      locationId: 'LOC-ESTE-ZIP',
      name: 'Sede Este',
      address: 'Calle 4 #12-15, Barrio La Paz, Zipaquirá',
      latitude: 5.0200,
      longitude: -73.9800,
      serviceTypes: ['Corte de cabello', 'Barba', 'Afeitado']
    },
    {
      locationId: 'LOC-OESTE-ZIP',
      name: 'Sede Oeste',
      address: 'Carrera 3 #5-20, Barrio San Carlos, Zipaquirá',
      latitude: 5.0250,
      longitude: -74.0050,
      serviceTypes: ['Depilación', 'Manicure', 'Pedicure', 'Facial']
    },
    {
      locationId: 'LOC-CATEDRAL-ZIP',
      name: 'Sede Catedral',
      address: 'Calle 6 #6-50, Cerca Catedral, Zipaquirá',
      latitude: 5.0190,
      longitude: -73.9935,
      serviceTypes: ['Keratina', 'Balayage', 'Corte de cabello', 'Tinte']
    }
  ];

  console.log(`\n✨ Creando ${LOCATIONS.length} locations con businessId: ${CORRECT_BUSINESS_ID}\n`);

  for (const location of LOCATIONS) {
    const now = new Date().toISOString();

    const locationData = {
      PK: `BUSINESS#${CORRECT_BUSINESS_ID}`,
      SK: `LOCATION#${location.locationId}`,
      GSI1PK: `LOCATION#${location.locationId}`,
      GSI1SK: `BUSINESS#${CORRECT_BUSINESS_ID}`,
      locationId: location.locationId,
      businessId: CORRECT_BUSINESS_ID,
      name: location.name,
      address: location.address,
      city: 'Zipaquirá',
      state: 'Cundinamarca',
      country: 'Colombia',
      zipCode: '250251',
      latitude: location.latitude,
      longitude: location.longitude,
      serviceTypes: location.serviceTypes,
      amenities: ['WiFi', 'Parking'],
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: LOCATIONS_TABLE,
      Item: locationData
    }));

    console.log(`   ✅ ${location.name} (${location.locationId})`);
    console.log(`      📍 ${location.address}`);
    console.log(`      🌐 (${location.latitude}, ${location.longitude})`);
  }
}

async function main() {
  try {
    await fixAppointments();
    await fixLocations();

    console.log('\n═'.repeat(70));
    console.log('✅ FIX COMPLETADO');
    console.log('═'.repeat(70));
    console.log(`\n📝 Resumen:`);
    console.log(`   • Todas las citas ahora usan businessId: ${CORRECT_BUSINESS_ID}`);
    console.log(`   • Todas las locations ahora usan businessId: ${CORRECT_BUSINESS_ID}`);
    console.log(`   • El dashboard debería cargar correctamente\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
