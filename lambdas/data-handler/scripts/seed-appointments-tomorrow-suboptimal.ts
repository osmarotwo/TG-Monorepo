/**
 * Script para crear 8 citas para MAÑANA (2025-10-23) con ruta INTENCIONALMENTE SUB-ÓPTIMA
 * 
 * Propósito: Demostrar el poder del algoritmo de optimización
 * 
 * Ruta sub-óptima diseñada:
 * Centro (5.0214°) → Sur (4.9214°) → Norte (5.1214°) → Oeste (5.0214°,-74.1637°) 
 * → Este (5.0214°,-73.9201°) → Catedral (5.0214°) → Centro → Sur
 * 
 * Saltos geográficos máximos para maximizar distancia y demostrar mejora del algoritmo
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const VALERIE_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';

// Locations EXTREMADAMENTE DISTANTES en toda Cundinamarca para maximizar mejora
const LOCATIONS = {
  'LOC-CENTRO-ZIP': { businessId: 'BIZ-SALON-BELLEZA', name: 'Zipaquirá Centro', lat: 5.0214, lng: -74.0637, address: 'Calle 3 #3-30, Centro, Zipaquirá' },
  'LOC-CHIA': { businessId: 'BIZ-SPA-RELAX', name: 'Chía', lat: 4.8614, lng: -74.0581, address: 'Av. Pradilla #10-20, Chía' },
  'LOC-CAJICA': { businessId: 'BIZ-PELUQUERIA-MODERNA', name: 'Cajicá', lat: 4.9187, lng: -74.0288, address: 'Calle 1 #5-30, Cajicá' },
  'LOC-TOCANCIPA': { businessId: 'BIZ-ESTETICA-BELLA', name: 'Tocancipá', lat: 4.9645, lng: -73.9087, address: 'Cra 7 #12-45, Tocancipá' },
  'LOC-COGUA': { businessId: 'BIZ-BARBERIA-CLASICA', name: 'Cogua', lat: 5.0594, lng: -73.9773, address: 'Calle Principal #8-15, Cogua' },
  'LOC-NEMOCON': { businessId: 'BIZ-SALON-ELITE', name: 'Nemocón', lat: 5.0525, lng: -73.8897, address: 'Plaza Central, Nemocón' },
  'LOC-TABIO': { businessId: 'BIZ-SALON-BELLEZA', name: 'Tabio', lat: 4.9197, lng: -74.0897, address: 'Calle 6 #4-20, Tabio' },
  'LOC-SOPO': { businessId: 'BIZ-SPA-RELAX', name: 'Sopó', lat: 4.9087, lng: -73.9437, address: 'Av. Central #15-30, Sopó' },
};

// Specialists (8 diferentes)
const SPECIALISTS = [
  { id: 'SPEC-001', name: 'María Pérez' },
  { id: 'SPEC-002', name: 'Carlos Rodríguez' },
  { id: 'SPEC-003', name: 'Ana García' },
  { id: 'SPEC-004', name: 'Juan López' },
  { id: 'SPEC-005', name: 'Laura Martínez' },
  { id: 'SPEC-006', name: 'Pedro Sánchez' },
  { id: 'SPEC-007', name: 'Sofía Hernández' },
  { id: 'SPEC-008', name: 'Diego Ramírez' },
];

// 8 citas con RUTA EXTREMADAMENTE CAÓTICA entre ciudades distantes
// Diseño: Máximos saltos entre ciudades para demostrar mejora del 40-50%
const APPOINTMENTS_TOMORROW = [
  {
    time: '09:00',
    locationId: 'LOC-CENTRO-ZIP', // Zipaquirá (5.0214, -74.0637)
    serviceName: 'Corte de cabello',
    estimatedDuration: 30,
    specialistIndex: 0,
  },
  {
    time: '10:00',
    locationId: 'LOC-NEMOCON', // ⚠️ SALTO EXTREMO: Zipaquirá → Nemocón (19.5 km al ESTE)
    serviceName: 'Masaje relajante',
    estimatedDuration: 60,
    specialistIndex: 1,
  },
  {
    time: '11:30',
    locationId: 'LOC-TABIO', // ⚠️ SALTO EXTREMO: Nemocón → Tabio (24.3 km al OESTE)
    serviceName: 'Tratamiento keratina',
    estimatedDuration: 120,
    specialistIndex: 2,
  },
  {
    time: '14:00',
    locationId: 'LOC-TOCANCIPA', // ⚠️ SALTO EXTREMO: Tabio → Tocancipá (21.7 km al ESTE)
    serviceName: 'Manicure completo',
    estimatedDuration: 45,
    specialistIndex: 3,
  },
  {
    time: '15:00',
    locationId: 'LOC-CHIA', // ⚠️ SALTO EXTREMO: Tocancipá → Chía (18.6 km al SUR-OESTE)
    serviceName: 'Corte de barba',
    estimatedDuration: 20,
    specialistIndex: 4,
  },
  {
    time: '16:00',
    locationId: 'LOC-COGUA', // ⚠️ SALTO: Chía → Cogua (25.1 km al NORTE)
    serviceName: 'Balayage profesional',
    estimatedDuration: 150,
    specialistIndex: 5,
  },
  {
    time: '19:00',
    locationId: 'LOC-SOPO', // ⚠️ SALTO EXTREMO: Cogua → Sopó (23.8 km al SUR-ESTE)
    serviceName: 'Pedicure spa',
    estimatedDuration: 60,
    specialistIndex: 6,
  },
  {
    time: '20:30',
    locationId: 'LOC-CAJICA', // ⚠️ SALTO: Sopó → Cajicá (10.2 km al NORTE-OESTE)
    serviceName: 'Facial hidratante',
    estimatedDuration: 90,
    specialistIndex: 7,
  },
];

async function deleteExistingAppointments() {
  console.log('🗑️  Eliminando citas existentes de Valerie...');
  
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: APPOINTMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${VALERIE_USER_ID}`,
        ':sk': 'APPOINTMENT#',
      },
    })
  );

  if (queryResult.Items && queryResult.Items.length > 0) {
    console.log(`   Encontradas ${queryResult.Items.length} citas para eliminar`);
    
    for (const item of queryResult.Items) {
      await docClient.send(
        new DeleteCommand({
          TableName: APPOINTMENTS_TABLE,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
    }
    console.log(`   ✅ ${queryResult.Items.length} citas eliminadas`);
  } else {
    console.log('   No hay citas existentes');
  }
}

async function createAppointmentsTomorrow() {
  console.log('\n📅 Creando 8 citas para MAÑANA (2025-10-23) con ruta SUB-ÓPTIMA...\n');
  
  const tomorrow = '2025-10-23';
  let totalDistance = 0;
  
  for (let i = 0; i < APPOINTMENTS_TOMORROW.length; i++) {
    const apt = APPOINTMENTS_TOMORROW[i];
    const location = LOCATIONS[apt.locationId as keyof typeof LOCATIONS];
    const specialist = SPECIALISTS[apt.specialistIndex];
    const appointmentId = `APT-${uuidv4().substring(0, 8)}`;

    // Calcular distancia del salto (aproximada)
    if (i > 0) {
      const prevApt = APPOINTMENTS_TOMORROW[i - 1];
      const prevLocation = LOCATIONS[prevApt.locationId as keyof typeof LOCATIONS];
      const distance = Math.sqrt(
        Math.pow((location.lat - prevLocation.lat) * 111, 2) +
        Math.pow((location.lng - prevLocation.lng) * 111 * Math.cos(location.lat * Math.PI / 180), 2)
      );
      totalDistance += distance;
      console.log(`   📍 ${apt.time} - ${apt.serviceName} (${apt.estimatedDuration}min)`);
      console.log(`      @ ${location.name} - ${specialist.name}`);
      console.log(`      ⚠️  SALTO de ${distance.toFixed(1)} km desde ${prevLocation.name}`);
    } else {
      console.log(`   📍 ${apt.time} - ${apt.serviceName} (${apt.estimatedDuration}min)`);
      console.log(`      @ ${location.name} - ${specialist.name}`);
    }

    const item = {
      PK: `USER#${VALERIE_USER_ID}`,
      SK: `APPOINTMENT#${appointmentId}`,
      GSI1PK: `DATE#${tomorrow}`,
      GSI1SK: `TIME#${apt.time}`,
      appointmentId,
      userId: VALERIE_USER_ID,
      businessId: location.businessId,
      locationId: apt.locationId,
      locationName: location.name,
      specialistId: specialist.id,
      specialistName: specialist.name,
      clientName: 'Valerie Sofia Martinez',
      serviceName: apt.serviceName,
      date: tomorrow,
      time: apt.time,
      estimatedDuration: apt.estimatedDuration,
      status: 'confirmed',
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: APPOINTMENTS_TABLE,
        Item: item,
      })
    );
  }

  console.log(`\n📊 RUTA SUB-ÓPTIMA CREADA:`);
  console.log(`   Distancia total aproximada: ${totalDistance.toFixed(1)} km`);
  console.log(`   Saltos geográficos: ${APPOINTMENTS_TOMORROW.length - 1}`);
  console.log(`   Mejora esperada con optimización: 30-40%`);
  console.log(`\n✅ 8 citas creadas exitosamente para ${tomorrow}`);
  console.log(`\n🎯 Ahora refresca el dashboard para ver la optimización en acción!`);
}

async function main() {
  try {
    console.log('🚀 Seed de citas SUB-ÓPTIMAS para demostración de optimización\n');
    console.log('═'.repeat(70));
    
    await deleteExistingAppointments();
    await createAppointmentsTomorrow();
    
    console.log('\n' + '═'.repeat(70));
    console.log('✨ Proceso completado!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
