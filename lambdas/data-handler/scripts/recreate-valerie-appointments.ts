/**
 * Script para RECREAR las 8 citas de Valerie con TODOS los datos correctos
 * - Cliente: Valerie (NO especialista)
 * - BusinessId correcto según location
 * - Servicio y horario definidos
 * - Ruta NO óptima para probar optimización
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const TODAY = '2025-10-22';

// VALERIE = CLIENTE
const CLIENT_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';
const CLIENT_NAME = 'Valerie Sofia Martinez';

// Especialistas que atienden a Valerie
const SPECIALISTS = [
  { id: 'SPEC-001', name: 'María Pérez' },
  { id: 'SPEC-002', name: 'Carlos Rodríguez' },
  { id: 'SPEC-003', name: 'Ana García' },
  { id: 'SPEC-004', name: 'Juan López' },
  { id: 'SPEC-005', name: 'Laura Martínez' },
  { id: 'SPEC-006', name: 'Pedro Sánchez' },
  { id: 'SPEC-007', name: 'Sofía Hernández' },
  { id: 'SPEC-008', name: 'Diego Ramírez' }
];

// Citas con ruta NO óptima (saltos geográficos)
const APPOINTMENTS = [
  {
    businessId: 'BIZ-SALON-BELLEZA',
    locationId: 'LOC-CENTRO-ZIP',
    locationName: 'Sede Centro',
    serviceName: 'Corte de cabello',
    estimatedDuration: 30,
    time: '14:00',
    specialist: SPECIALISTS[0],
    coordinates: { latitude: 5.0214, longitude: -73.9919 }
  },
  {
    businessId: 'BIZ-SPA-RELAX',
    locationId: 'LOC-SUR-ZIP',
    locationName: 'Sede Sur',
    serviceName: 'Masaje',
    estimatedDuration: 60,
    time: '15:00',
    specialist: SPECIALISTS[1],
    coordinates: { latitude: 5.0100, longitude: -73.9980 }
  },
  {
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    locationId: 'LOC-NORTE-ZIP',
    locationName: 'Sede Norte',
    serviceName: 'Keratina',
    estimatedDuration: 120,
    time: '16:30',
    specialist: SPECIALISTS[2],
    coordinates: { latitude: 5.0345, longitude: -73.9850 }
  },
  {
    businessId: 'BIZ-ESTETICA-BELLA',
    locationId: 'LOC-OESTE-ZIP',
    locationName: 'Sede Oeste',
    serviceName: 'Manicure',
    estimatedDuration: 45,
    time: '19:00',
    specialist: SPECIALISTS[3],
    coordinates: { latitude: 5.0250, longitude: -74.0050 }
  },
  {
    businessId: 'BIZ-BARBERIA-CLASICA',
    locationId: 'LOC-ESTE-ZIP',
    locationName: 'Sede Este',
    serviceName: 'Barba',
    estimatedDuration: 20,
    time: '20:00',
    specialist: SPECIALISTS[4],
    coordinates: { latitude: 5.0200, longitude: -73.9800 }
  },
  {
    businessId: 'BIZ-SALON-ELITE',
    locationId: 'LOC-CATEDRAL-ZIP',
    locationName: 'Sede Catedral',
    serviceName: 'Balayage',
    estimatedDuration: 150,
    time: '20:30',
    specialist: SPECIALISTS[5],
    coordinates: { latitude: 5.0190, longitude: -73.9935 }
  },
  {
    businessId: 'BIZ-SALON-BELLEZA',
    locationId: 'LOC-CENTRO-ZIP',
    locationName: 'Sede Centro',
    serviceName: 'Manicure',
    estimatedDuration: 45,
    time: '23:30',
    specialist: SPECIALISTS[6],
    coordinates: { latitude: 5.0214, longitude: -73.9919 }
  },
  {
    businessId: 'BIZ-SPA-RELAX',
    locationId: 'LOC-SUR-ZIP',
    locationName: 'Sede Sur',
    serviceName: 'Pedicure',
    estimatedDuration: 60,
    time: '23:59',
    specialist: SPECIALISTS[7],
    coordinates: { latitude: 5.0100, longitude: -73.9980 }
  }
];

async function deleteAllValerieAppointments() {
  console.log('═'.repeat(70));
  console.log('🗑️  ELIMINANDO: Citas existentes de Valerie');
  console.log('═'.repeat(70));

  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${CLIENT_USER_ID}`
    }
  }));

  const toDelete = scanResult.Items || [];
  console.log(`\n📊 Citas a eliminar: ${toDelete.length}\n`);

  for (const item of toDelete) {
    await docClient.send(new DeleteCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: { PK: item.PK, SK: item.SK }
    }));
    console.log(`   ❌ Eliminada: ${item.SK}`);
  }

  console.log(`\n✅ ${toDelete.length} citas eliminadas\n`);
}

async function createAppointments() {
  console.log('═'.repeat(70));
  console.log('📅 CREANDO: Nuevas citas para Valerie');
  console.log('═'.repeat(70));
  console.log(`\n👤 Cliente: ${CLIENT_NAME}`);
  console.log(`📅 Fecha: ${TODAY}`);
  console.log(`📍 Total citas: ${APPOINTMENTS.length}\n`);

  for (const apt of APPOINTMENTS) {
    const appointmentId = `APT-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const appointmentData = {
      PK: `USER#${CLIENT_USER_ID}`,
      SK: `APPOINTMENT#${appointmentId}`,
      GSI1PK: `DATE#${TODAY}`,
      GSI1SK: `APPOINTMENT#${appointmentId}`,
      
      appointmentId,
      userId: CLIENT_USER_ID,
      clientName: CLIENT_NAME,
      
      businessId: apt.businessId,
      locationId: apt.locationId,
      locationName: apt.locationName,
      
      specialistId: apt.specialist.id,
      specialistName: apt.specialist.name,
      
      serviceName: apt.serviceName,
      estimatedDuration: apt.estimatedDuration,
      
      date: TODAY,
      time: apt.time,
      status: 'confirmed',
      
      coordinates: apt.coordinates,
      
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: appointmentData
    }));

    console.log(`✅ ${apt.time} - ${apt.serviceName} (${apt.estimatedDuration}min)`);
    console.log(`   📍 ${apt.locationName}`);
    console.log(`   👨‍💼 Especialista: ${apt.specialist.name}`);
    console.log('');
  }

  console.log('═'.repeat(70));
  console.log('✅ CITAS CREADAS EXITOSAMENTE');
  console.log('═'.repeat(70));
  console.log(`\n📝 Resumen:`);
  console.log(`   • ${APPOINTMENTS.length} citas creadas para Valerie (cliente)`);
  console.log(`   • Ruta NO óptima (saltos geográficos)`);
  console.log(`   • Todos los datos completos (servicio, horario, duración)`);
  console.log(`   • Listo para probar optimización\n`);
}

async function main() {
  await deleteAllValerieAppointments();
  await createAppointments();
}

main().catch(console.error);
