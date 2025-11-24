/**
 * Seed script para crear citas de prueba para HOY TARDE (23 nov) y MAÑANA (24 nov 2025)
 * 
 * Características:
 * - Elimina todas las citas existentes
 * - HOY: 3 citas por la tarde (15:00-17:00)
 * - MAÑANA: 6 citas durante todo el día
 * - Mezcla de citas de negocio y personales
 * - Ruta NO óptima para demostrar beneficios de optimización
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';

// Fechas
const TODAY = '2025-11-23';
const TOMORROW = '2025-11-24';

// Usuario Valerie para las citas
const SPECIALIST_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';
const SPECIALIST_NAME = 'Valerie Sofia Martinez';

// Sedes de Zipaquirá
const LOCATIONS = [
  {
    locationId: 'LOC-CENTRO-ZIP',
    businessId: 'BIZ-SALON-BELLEZA',
    businessName: 'Salón Belleza Total',
    name: 'Sede Centro',
    address: 'Cra 7 #3-45, Centro, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0214, longitude: -73.9919 },
    serviceTypes: ['Corte de cabello', 'Manicure', 'Pedicure']
  },
  {
    locationId: 'LOC-NORTE-ZIP',
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    businessName: 'Peluquería Moderna',
    name: 'Sede Norte',
    address: 'Calle 10 #8-32, Barrio San Juanito, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0345, longitude: -73.9850 },
    serviceTypes: ['Keratina', 'Tinte', 'Corte de cabello']
  },
  {
    locationId: 'LOC-SUR-ZIP',
    businessId: 'BIZ-SPA-RELAX',
    businessName: 'Spa Relax',
    name: 'Sede Sur',
    address: 'Carrera 5 #1-80, Barrio La Fraguita, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0100, longitude: -73.9980 },
    serviceTypes: ['Masaje', 'Facial', 'Manicure']
  },
  {
    locationId: 'LOC-ESTE-ZIP',
    businessId: 'BIZ-BARBERIA-CLASICA',
    businessName: 'Barbería Clásica',
    name: 'Sede Este',
    address: 'Calle 4 #12-15, Barrio La Paz, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0200, longitude: -73.9800 },
    serviceTypes: ['Corte de cabello', 'Barba', 'Afeitado']
  },
  {
    locationId: 'LOC-OESTE-ZIP',
    businessId: 'BIZ-ESTETICA-BELLA',
    businessName: 'Estética Bella',
    name: 'Sede Oeste',
    address: 'Carrera 3 #5-20, Barrio San Carlos, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0250, longitude: -74.0050 },
    serviceTypes: ['Depilación', 'Manicure', 'Pedicure']
  }
];

// Servicios con duraciones
const SERVICES = [
  { name: 'Corte de cabello', duration: 30 },
  { name: 'Manicure', duration: 45 },
  { name: 'Masaje', duration: 60 },
  { name: 'Barba', duration: 20 },
  { name: 'Depilación', duration: 45 }
];

// Clientes
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
 * Elimina todas las citas existentes
 */
async function deleteAllAppointments() {
  console.log('🗑️  Eliminando todas las citas existentes...');
  
  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE
  }));

  if (!scanResult.Items || scanResult.Items.length === 0) {
    console.log('✅ No hay citas para eliminar');
    return;
  }

  let deletedCount = 0;
  for (const item of scanResult.Items) {
    await docClient.send(new DeleteCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));
    deletedCount++;
  }

  console.log(`✅ Eliminadas ${deletedCount} citas\n`);
}

/**
 * Crea cita de negocio
 */
async function createBusinessAppointment(
  date: string,
  time: string,
  location: typeof LOCATIONS[0],
  customer: typeof CUSTOMERS[0],
  service: typeof SERVICES[0]
) {
  const startTime = `${date}T${time}:00-05:00`;
  const endTime = new Date(new Date(startTime).getTime() + service.duration * 60000).toISOString();
  const appointmentId = uuidv4();
  const now = new Date().toISOString();

  const appointmentData = {
    PK: `USER#${SPECIALIST_USER_ID}`,
    SK: `APPOINTMENT#${date}#${appointmentId}`,
    appointmentId,
    businessId: location.businessId,
    locationId: location.locationId,
    locationName: location.name,
    userId: SPECIALIST_USER_ID,
    customerId: customer.id,
    customerName: customer.name,
    serviceType: service.name,
    specialistName: SPECIALIST_NAME,
    specialistId: SPECIALIST_USER_ID,
    startTime,
    endTime,
    estimatedDuration: service.duration,
    status: 'confirmed',
    resourceId: `RES-${location.locationId}`,
    notes: `Sede: ${location.name} (${location.businessName})`,
    date: date,
    time: time,
    location: {
      name: location.name,
      address: location.address,
      city: location.city,
      coordinates: location.coordinates
    },
    createdAt: now,
    updatedAt: now,
    GSI1PK: `DATE#${date}`,
    GSI1SK: `TIME#${time}#${appointmentId}`,
    GSI2PK: `LOCATION#${location.locationId}`,
    GSI2SK: `DATE#${date}#TIME#${time}`
  };

  await docClient.send(new PutCommand({
    TableName: APPOINTMENTS_TABLE,
    Item: appointmentData
  }));

  return appointmentData;
}

/**
 * Crea cita personal
 */
async function createPersonalAppointment(
  date: string,
  time: string,
  title: string,
  description: string,
  address: string,
  latitude: number,
  longitude: number,
  duration: number
) {
  const startTime = `${date}T${time}:00-05:00`;
  const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();
  const appointmentId = uuidv4();
  const now = new Date().toISOString();

  const appointmentData = {
    PK: `USER#${SPECIALIST_USER_ID}`,
    SK: `APPOINTMENT#${date}#${appointmentId}`,
    appointmentId,
    userId: SPECIALIST_USER_ID,
    type: 'personal',
    isFlexible: false,
    title,
    description,
    address,
    latitude,
    longitude,
    startTime,
    endTime,
    duration,
    status: 'confirmed',
    date: date,
    time: time,
    createdAt: now,
    updatedAt: now,
    GSI1PK: `DATE#${date}`,
    GSI1SK: `TIME#${time}#${appointmentId}`
  };

  await docClient.send(new PutCommand({
    TableName: APPOINTMENTS_TABLE,
    Item: appointmentData
  }));

  return appointmentData;
}

/**
 * Seed para HOY (3 citas por la tarde)
 */
async function seedToday() {
  console.log(`\n📅 Creando citas para HOY TARDE (${TODAY})...\n`);

  const appointments = [];

  // 15:00 - Cita de negocio
  appointments.push(await createBusinessAppointment(
    TODAY, '15:00', LOCATIONS[0], CUSTOMERS[0], SERVICES[0]
  ));
  console.log(`✅ 15:00 - ${SERVICES[0].name} con ${CUSTOMERS[0].name} en ${LOCATIONS[0].name}`);

  // 16:00 - Cita personal (Gimnasio)
  appointments.push(await createPersonalAppointment(
    TODAY, '16:00',
    'Gimnasio',
    'Rutina de entrenamiento',
    'Calle 8 #10-50, Zipaquirá',
    5.0280, -73.9900,
    60
  ));
  console.log(`✅ 16:00 - Cita personal: Gimnasio`);

  // 17:15 - Cita de negocio
  appointments.push(await createBusinessAppointment(
    TODAY, '17:15', LOCATIONS[2], CUSTOMERS[1], SERVICES[2]
  ));
  console.log(`✅ 17:15 - ${SERVICES[2].name} con ${CUSTOMERS[1].name} en ${LOCATIONS[2].name}`);

  console.log(`\n✅ Total: ${appointments.length} citas creadas para HOY\n`);
  return appointments.length;
}

/**
 * Seed para MAÑANA (6 citas durante el día)
 */
async function seedTomorrow() {
  console.log(`\n📅 Creando citas para MAÑANA (${TOMORROW})...\n`);

  const appointments = [];

  // 08:00 - Cita de negocio
  appointments.push(await createBusinessAppointment(
    TOMORROW, '08:00', LOCATIONS[0], CUSTOMERS[2], SERVICES[0]
  ));
  console.log(`✅ 08:00 - ${SERVICES[0].name} con ${CUSTOMERS[2].name} en ${LOCATIONS[0].name}`);

  // 09:00 - Cita personal (Cita médica)
  appointments.push(await createPersonalAppointment(
    TOMORROW, '09:00',
    'Cita Médica',
    'Chequeo general anual',
    'Carrera 6 #5-30, Centro Médico, Zipaquirá',
    5.0195, -73.9945,
    90
  ));
  console.log(`✅ 09:00 - Cita personal: Cita Médica`);

  // 11:00 - Cita de negocio
  appointments.push(await createBusinessAppointment(
    TOMORROW, '11:00', LOCATIONS[3], CUSTOMERS[3], SERVICES[3]
  ));
  console.log(`✅ 11:00 - ${SERVICES[3].name} con ${CUSTOMERS[3].name} en ${LOCATIONS[3].name}`);

  // 12:00 - Cita de negocio
  appointments.push(await createBusinessAppointment(
    TOMORROW, '12:00', LOCATIONS[1], CUSTOMERS[4], SERVICES[1]
  ));
  console.log(`✅ 12:00 - ${SERVICES[1].name} con ${CUSTOMERS[4].name} en ${LOCATIONS[1].name}`);

  // 14:00 - Cita personal (Almuerzo de trabajo)
  appointments.push(await createPersonalAppointment(
    TOMORROW, '14:00',
    'Almuerzo de Trabajo',
    'Reunión con cliente importante',
    'Calle 5 #7-20, Restaurante La Plaza, Zipaquirá',
    5.0210, -73.9925,
    90
  ));
  console.log(`✅ 14:00 - Cita personal: Almuerzo de Trabajo`);

  // 16:00 - Cita de negocio
  appointments.push(await createBusinessAppointment(
    TOMORROW, '16:00', LOCATIONS[4], CUSTOMERS[5], SERVICES[4]
  ));
  console.log(`✅ 16:00 - ${SERVICES[4].name} con ${CUSTOMERS[5].name} en ${LOCATIONS[4].name}`);

  console.log(`\n✅ Total: ${appointments.length} citas creadas para MAÑANA\n`);
  return appointments.length;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Iniciando seed de citas para HOY (23 nov) y MAÑANA (24 nov 2025)...\n');
    
    // 1. Eliminar citas existentes
    await deleteAllAppointments();
    
    // 2. Crear citas para HOY (tarde)
    const todayCount = await seedToday();
    
    // 3. Crear citas para MAÑANA (todo el día)
    const tomorrowCount = await seedTomorrow();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed completado exitosamente!\n');
    console.log(`📊 RESUMEN TOTAL:`);
    console.log(`   - Citas para HOY (${TODAY}): ${todayCount} (tarde)`);
    console.log(`   - Citas para MAÑANA (${TOMORROW}): ${tomorrowCount}`);
    console.log(`   - Total de citas creadas: ${todayCount + tomorrowCount}`);
    console.log(`   - Citas de negocio: ${todayCount + tomorrowCount - 3}`);
    console.log(`   - Citas personales: 3`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Siguiente paso: Probar la funcionalidad de optimización de rutas');
    console.log('   en el dashboard para ver citas de negocio y personales juntas.\n');
    
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  }
}

// Ejecutar
main().catch(console.error);
