/**
 * Seed script para crear citas de prueba para HOY (11 nov) y MAÑANA (12 nov 2025)
 * 
 * Características:
 * - Elimina todas las citas existentes
 * - Crea citas en múltiples comercios y sedes
 * - Ruta NO óptima para demostrar beneficios de optimización
 * - Diferentes duraciones de servicios (30min, 60min, 90min, 120min)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const LOCATIONS_TABLE = 'Locations';

// Fechas de hoy y mañana
const TODAY = '2025-11-11';
const TOMORROW = '2025-11-12';

// Usuario Valerie para las citas
const SPECIALIST_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'; // Valerie Sofia Martinez
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
    coordinates: { latitude: 5.0214, longitude: -73.9919 }, // Centro Zipaquirá
    serviceTypes: ['Corte de cabello', 'Manicure', 'Pedicure']
  },
  {
    locationId: 'LOC-NORTE-ZIP',
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    businessName: 'Peluquería Moderna',
    name: 'Sede Norte',
    address: 'Calle 10 #8-32, Barrio San Juanito, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0345, longitude: -73.9850 }, // Norte Zipaquirá (1.5 km del centro)
    serviceTypes: ['Keratina', 'Tinte', 'Corte de cabello']
  },
  {
    locationId: 'LOC-SUR-ZIP',
    businessId: 'BIZ-SPA-RELAX',
    businessName: 'Spa Relax',
    name: 'Sede Sur',
    address: 'Carrera 5 #1-80, Barrio La Fraguita, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0100, longitude: -73.9980 }, // Sur Zipaquirá (1.3 km del centro)
    serviceTypes: ['Masaje', 'Facial', 'Manicure']
  },
  {
    locationId: 'LOC-ESTE-ZIP',
    businessId: 'BIZ-BARBERIA-CLASICA',
    businessName: 'Barbería Clásica',
    name: 'Sede Este',
    address: 'Calle 4 #12-15, Barrio La Paz, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0200, longitude: -73.9800 }, // Este Zipaquirá (1.2 km del centro)
    serviceTypes: ['Corte de cabello', 'Barba', 'Afeitado']
  },
  {
    locationId: 'LOC-OESTE-ZIP',
    businessId: 'BIZ-ESTETICA-BELLA',
    businessName: 'Estética Bella',
    name: 'Sede Oeste',
    address: 'Carrera 3 #5-20, Barrio San Carlos, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0250, longitude: -74.0050 }, // Oeste Zipaquirá (1.4 km del centro)
    serviceTypes: ['Depilación', 'Manicure', 'Pedicure']
  },
  {
    locationId: 'LOC-CATEDRAL-ZIP',
    businessId: 'BIZ-SALON-ELITE',
    businessName: 'Salón Elite',
    name: 'Sede Catedral',
    address: 'Calle 6 #6-50, Cerca Catedral, Zipaquirá',
    city: 'Zipaquirá',
    coordinates: { latitude: 5.0190, longitude: -73.9935 }, // Cerca de la Catedral de Sal
    serviceTypes: ['Keratina', 'Balayage', 'Corte de cabello']
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
  { name: 'Afeitado', duration: 15 },
  { name: 'Masaje', duration: 60 },
  { name: 'Facial', duration: 75 },
  { name: 'Depilación', duration: 45 },
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
  { id: 'CUST-008', name: 'Diego Torres' },
  { id: 'CUST-009', name: 'Carmen Ruiz' },
  { id: 'CUST-010', name: 'Roberto Silva' },
  { id: 'CUST-011', name: 'Patricia Morales' },
  { id: 'CUST-012', name: 'Fernando Castro' }
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

  for (const item of scanResult.Items) {
    await docClient.send(new DeleteCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));
  }

  console.log(`✅ Eliminadas ${scanResult.Items.length} citas`);
}

/**
 * Crea citas con ruta NO óptima (saltos geográficos)
 */
async function createAppointmentsForDate(date: string, dateLabel: string, startCustomerIndex: number) {
  console.log(`\n📅 Creando citas para ${dateLabel} (${date}) con ruta NO óptima...\n`);

  // Ruta NO óptima: Saltar entre ubicaciones lejanas
  const nonOptimalRoute = [
    { location: LOCATIONS[0], customer: CUSTOMERS[startCustomerIndex], service: 'Corte de cabello', time: '08:00' }, // Centro
    { location: LOCATIONS[2], customer: CUSTOMERS[startCustomerIndex + 1], service: 'Masaje', time: '09:00' },      // Sur (salto)
    { location: LOCATIONS[1], customer: CUSTOMERS[startCustomerIndex + 2], service: 'Keratina', time: '10:30' },    // Norte (salto largo)
    { location: LOCATIONS[4], customer: CUSTOMERS[startCustomerIndex + 3], service: 'Depilación', time: '13:00' },  // Oeste (salto)
    { location: LOCATIONS[3], customer: CUSTOMERS[startCustomerIndex + 4], service: 'Barba', time: '14:00' },       // Este (salto)
    { location: LOCATIONS[5], customer: CUSTOMERS[startCustomerIndex + 5], service: 'Balayage', time: '14:30' }     // Catedral (salto)
  ];

  const appointments = [];

  for (const appointment of nonOptimalRoute) {
    const serviceDetails = SERVICES.find(s => s.name === appointment.service);
    const startTime = `${date}T${appointment.time}:00.000Z`;
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
      notes: `Ruta NO óptima - Sede: ${appointment.location.name} (${appointment.location.businessName})`,
      // Campos requeridos para filtrado en el handler
      date: date, // YYYY-MM-DD
      time: appointment.time, // HH:MM
      location: {
        name: appointment.location.name,
        address: appointment.location.address,
        city: appointment.location.city,
        coordinates: appointment.location.coordinates
      },
      createdAt: now,
      updatedAt: now,
      GSI1PK: `DATE#${date}`,
      GSI1SK: `TIME#${appointment.time}#${appointmentId}`,
      GSI2PK: `LOCATION#${appointment.location.locationId}`,
      GSI2SK: `DATE#${date}#TIME#${appointment.time}`
    };

    appointments.push(appointmentData);
  }

  // Guardar todas las citas
  for (const appointment of appointments) {
    await docClient.send(new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: appointment
    }));

    console.log(`✅ Cita creada: ${appointment.time} - ${appointment.serviceType} con ${appointment.customerName} en ${appointment.locationName}`);
  }

  console.log(`\n✅ Total: ${appointments.length} citas creadas para ${date}\n`);

  // Resumen de la ruta NO óptima
  console.log(`📍 RUTA NO ÓPTIMA CREADA PARA ${dateLabel.toUpperCase()}:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  appointments.forEach((apt, index) => {
    console.log(`${index + 1}. ${apt.time} - ${apt.locationName} (${apt.location.city})`);
    console.log(`   → ${apt.serviceType} (${apt.estimatedDuration}min) con ${apt.customerName}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Calcular distancias aproximadas
  console.log(`📊 ANÁLISIS DE DISTANCIAS PARA ${dateLabel.toUpperCase()}:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  let totalDistance = 0;
  for (let i = 0; i < appointments.length - 1; i++) {
    const current = appointments[i].location.coordinates;
    const next = appointments[i + 1].location.coordinates;
    const distance = calculateDistance(current, next);
    totalDistance += distance;
    console.log(`${appointments[i].locationName} → ${appointments[i + 1].locationName}: ${distance.toFixed(2)} km`);
  }
  console.log(`\n🚗 Distancia total aproximada: ${totalDistance.toFixed(2)} km`);
  console.log('⚠️  Esta ruta NO está optimizada (muchos saltos entre ubicaciones lejanas)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return appointments.length;
}

/**
 * Calcula distancia aproximada entre dos puntos (fórmula de Haversine simplificada)
 */
function calculateDistance(coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Iniciando seed de citas para HOY (11 nov) y MAÑANA (12 nov 2025)...\n');
    
    // 1. Eliminar citas existentes
    await deleteAllAppointments();
    
    // 2. Crear citas para HOY (11 de noviembre)
    const todayCount = await createAppointmentsForDate(TODAY, 'HOY', 0);
    
    // 3. Crear citas para MAÑANA (12 de noviembre)
    const tomorrowCount = await createAppointmentsForDate(TOMORROW, 'MAÑANA', 6);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed completado exitosamente!\n');
    console.log(`📊 RESUMEN TOTAL:`);
    console.log(`   - Citas para HOY (${TODAY}): ${todayCount}`);
    console.log(`   - Citas para MAÑANA (${TOMORROW}): ${tomorrowCount}`);
    console.log(`   - Total de citas creadas: ${todayCount + tomorrowCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Siguiente paso: Probar la funcionalidad de optimización de rutas');
    console.log('   para ver cómo se puede mejorar estas rutas NO óptimas.\n');
    
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  }
}

// Ejecutar
main().catch(console.error);
