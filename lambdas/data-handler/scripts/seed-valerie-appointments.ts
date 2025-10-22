/**
 * Seed script para crear citas de prueba para el usuario VALERIE
 * Usuario: Valerie Sofia Martinez
 * UserId: 5fabb21e-3722-43ab-b491-5e53a45f9616
 * Fecha: HOY (22 de octubre de 2025)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';

// Fecha de HOY (22 de octubre de 2025)
const TODAY = '2025-10-22';

// Usuario Valerie
const SPECIALIST_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';
const SPECIALIST_NAME = 'Valerie Sofia Martinez';

// Sedes reales de Zipaquirá con coordenadas
const LOCATIONS = [
  {
    locationId: 'LOC-CENTRO-ZIP',
    businessId: 'BIZ-SALON-BELLEZA',
    businessName: 'Salón Belleza Total',
    name: 'Sede Centro',
    address: 'Cra 7 #3-45, Centro, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0214, longitude: -73.9919 }
  },
  {
    locationId: 'LOC-NORTE-ZIP',
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    businessName: 'Peluquería Moderna',
    name: 'Sede Norte',
    address: 'Calle 10 #8-32, Barrio San Juanito, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0345, longitude: -73.9850 }
  },
  {
    locationId: 'LOC-SUR-ZIP',
    businessId: 'BIZ-SPA-RELAX',
    businessName: 'Spa Relax',
    name: 'Sede Sur',
    address: 'Carrera 5 #1-80, Barrio La Fraguita, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0100, longitude: -73.9980 }
  },
  {
    locationId: 'LOC-ESTE-ZIP',
    businessId: 'BIZ-BARBERIA-CLASICA',
    businessName: 'Barbería Clásica',
    name: 'Sede Este',
    address: 'Calle 4 #12-15, Barrio La Paz, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0200, longitude: -73.9800 }
  },
  {
    locationId: 'LOC-OESTE-ZIP',
    businessId: 'BIZ-ESTETICA-BELLA',
    businessName: 'Estética Bella',
    name: 'Sede Oeste',
    address: 'Carrera 3 #5-20, Barrio San Carlos, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0250, longitude: -74.0050 }
  },
  {
    locationId: 'LOC-CATEDRAL-ZIP',
    businessId: 'BIZ-SALON-ELITE',
    businessName: 'Salón Elite',
    name: 'Sede Catedral',
    address: 'Calle 6 #6-50, Cerca Catedral, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0190, longitude: -73.9935 }
  }
];

// Servicios con duraciones realistas
const SERVICES = [
  { name: 'Corte de cabello', duration: 30 },
  { name: 'Manicure', duration: 45 },
  { name: 'Pedicure', duration: 60 },
  { name: 'Tinte', duration: 90 },
  { name: 'Keratina', duration: 120 },
  { name: 'Barba', duration: 20 },
  { name: 'Masaje', duration: 60 },
  { name: 'Balayage', duration: 150 }
];

// Clientes de prueba
const CUSTOMERS = [
  { id: 'CUST-001', name: 'Ana García' },
  { id: 'CUST-002', name: 'Carlos Rodríguez' },
  { id: 'CUST-003', name: 'María López' },
  { id: 'CUST-004', name: 'Juan Martínez' },
  { id: 'CUST-005', name: 'Laura Pérez' },
  { id: 'CUST-006', name: 'Pedro Sánchez' },
  { id: 'CUST-007', name: 'Sofía Ramírez' },
  { id: 'CUST-008', name: 'Diego Torres' }
];

/**
 * Elimina todas las citas del usuario Valerie
 */
async function deleteValerieAppointments() {
  console.log('🗑️  Eliminando citas existentes de Valerie...');
  
  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': SPECIALIST_USER_ID
    }
  }));

  if (!scanResult.Items || scanResult.Items.length === 0) {
    console.log('✅ No hay citas para eliminar');
    return;
  }

  for (const item of scanResult.Items) {
    await docClient.send(new DeleteCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));
  }

  console.log(`✅ Eliminadas ${scanResult.Items.length} citas de Valerie`);
}

/**
 * Crea citas con ruta NO óptima para Valerie
 */
async function createValerieAppointments() {
  console.log(`\n📅 Creando citas para Valerie - HOY (${TODAY})...\n`);

  // Ruta NO óptima: Saltar entre ubicaciones lejanas
  const nonOptimalRoute = [
    { location: LOCATIONS[0], customer: CUSTOMERS[0], service: 'Corte de cabello', time: '14:00' }, // Centro
    { location: LOCATIONS[2], customer: CUSTOMERS[1], service: 'Masaje', time: '15:00' },          // Sur
    { location: LOCATIONS[1], customer: CUSTOMERS[2], service: 'Keratina', time: '16:30' },        // Norte
    { location: LOCATIONS[4], customer: CUSTOMERS[3], service: 'Manicure', time: '19:00' },        // Oeste
    { location: LOCATIONS[3], customer: CUSTOMERS[4], service: 'Barba', time: '20:00' },           // Este
    { location: LOCATIONS[5], customer: CUSTOMERS[5], service: 'Balayage', time: '20:30' },        // Catedral
    { location: LOCATIONS[0], customer: CUSTOMERS[6], service: 'Manicure', time: '23:30' },        // Centro
    { location: LOCATIONS[2], customer: CUSTOMERS[7], service: 'Pedicure', time: '23:59' }         // Sur
  ];

  const appointments = [];

  for (const appointment of nonOptimalRoute) {
    const serviceDetails = SERVICES.find(s => s.name === appointment.service);
    const startTime = `${TODAY}T${appointment.time}:00.000Z`;
    const endTime = new Date(new Date(startTime).getTime() + serviceDetails!.duration * 60000).toISOString();

    const appointmentId = `APT-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const appointmentData = {
      PK: `USER#${SPECIALIST_USER_ID}`,
      SK: `APPOINTMENT#${appointmentId}`,
      appointmentId,
      businessId: appointment.location.businessId,
      locationId: appointment.location.locationId,
      locationName: appointment.location.name,
      userId: SPECIALIST_USER_ID,
      customerId: appointment.customer.id,
      customerName: appointment.customer.name,
      serviceType: appointment.service,
      specialistName: SPECIALIST_NAME,
      specialistId: SPECIALIST_USER_ID,
      startTime,
      endTime,
      estimatedDuration: serviceDetails!.duration,
      status: 'confirmed',
      resourceId: `RES-${appointment.location.locationId}`,
      notes: `Ruta NO óptima - Sede: ${appointment.location.name}`,
      location: {
        name: appointment.location.name,
        address: appointment.location.address,
        city: appointment.location.city,
        latitude: appointment.location.coordinates.latitude,
        longitude: appointment.location.coordinates.longitude
      },
      createdAt: now,
      updatedAt: now,
      
      // GSI1 para búsqueda por fecha
      GSI1PK: `DATE#${TODAY}`,
      GSI1SK: `USER#${SPECIALIST_USER_ID}#${startTime}`,
      
      // GSI2 para búsqueda por ubicación
      GSI2PK: `LOCATION#${appointment.location.locationId}`,
      GSI2SK: `DATE#${TODAY}#${startTime}`
    };

    await docClient.send(new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: appointmentData
    }));

    appointments.push(appointmentData);

    console.log(`✅ ${appointment.customer.name} - ${appointment.service} (${serviceDetails!.duration}min) - ${appointment.time} @ ${appointment.location.name}`);
  }

  return appointments;
}

/**
 * Script principal
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('🌱 SEED: Citas para VALERIE - HOY (22 de octubre de 2025)');
  console.log('═'.repeat(70));
  console.log(`\n👤 Usuario: ${SPECIALIST_NAME}`);
  console.log(`🆔 UserId: ${SPECIALIST_USER_ID}\n`);
  
  try {
    await deleteValerieAppointments();
    const appointments = await createValerieAppointments();
    
    console.log('\n' + '═'.repeat(70));
    console.log(`✅ ${appointments.length} citas creadas para Valerie`);
    console.log('═'.repeat(70));
    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Refrescar localhost:3000/dashboard (Cmd+Shift+R)');
    console.log('   2. ✅ Deberías ver las 8 citas');
    console.log('   3. 🚀 Haz clic en "Optimizar Ruta"');
    console.log('   4. 👀 Verifica columna "Duración" en tabla\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main();
