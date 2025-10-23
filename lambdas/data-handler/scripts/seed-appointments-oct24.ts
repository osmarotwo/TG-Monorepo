/**
 * Seed script para crear citas de prueba para MAÑANA (24 de octubre de 2025)
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

// Fecha de mañana (24 de octubre de 2025)
const TOMORROW = '2025-10-24';

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
 * 
 * Estrategia: Alternar entre ubicaciones lejanas para forzar viajes largos
 */
async function createNonOptimalAppointments() {
  console.log(`\n📅 Creando citas para mañana (${TOMORROW}) con ruta NO óptima...\n`);

  // Ruta NO óptima: Saltar entre ubicaciones lejanas
  const nonOptimalRoute = [
    { location: LOCATIONS[0], customer: CUSTOMERS[0], service: 'Corte de cabello', time: '08:00' }, // Centro
    { location: LOCATIONS[2], customer: CUSTOMERS[1], service: 'Masaje', time: '09:00' },          // Sur (salto)
    { location: LOCATIONS[1], customer: CUSTOMERS[2], service: 'Keratina', time: '10:30' },        // Norte (salto largo)
    { location: LOCATIONS[4], customer: CUSTOMERS[3], service: 'Depilación', time: '13:00' },      // Oeste (salto)
    { location: LOCATIONS[3], customer: CUSTOMERS[4], service: 'Barba', time: '14:00' },           // Este (salto)
    { location: LOCATIONS[5], customer: CUSTOMERS[5], service: 'Balayage', time: '14:30' },        // Catedral (salto)
    { location: LOCATIONS[0], customer: CUSTOMERS[6], service: 'Manicure', time: '17:30' },        // Centro (regreso)
    { location: LOCATIONS[2], customer: CUSTOMERS[7], service: 'Pedicure', time: '18:30' }         // Sur (salto final)
  ];

  const appointments = [];

  for (const appointment of nonOptimalRoute) {
    const serviceDetails = SERVICES.find(s => s.name === appointment.service);
    const startTime = `${TOMORROW}T${appointment.time}:00.000Z`;
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
      date: TOMORROW, // YYYY-MM-DD
      time: appointment.time, // HH:MM
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
      GSI1PK: `DATE#${TOMORROW}`,
      GSI1SK: `USER#${SPECIALIST_USER_ID}#${startTime}`,
      
      // GSI2 para búsqueda por ubicación
      GSI2PK: `LOCATION#${appointment.location.locationId}`,
      GSI2SK: `DATE#${TOMORROW}#${startTime}`
    };

    await docClient.send(new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: appointmentData
    }));

    appointments.push(appointmentData);

    console.log(`✅ Cita creada: ${appointment.customer.name} - ${appointment.service} (${serviceDetails!.duration}min) - ${appointment.time} @ ${appointment.location.name}`);
  }

  return appointments;
}

/**
 * Calcula distancia entre dos puntos (Haversine)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Muestra estadísticas de la ruta NO óptima
 */
function showRouteStatistics(appointments: any[]) {
  console.log('\n📊 Estadísticas de la Ruta NO Óptima:\n');
  
  let totalDistance = 0;
  let totalTravelTime = 0;
  const AVERAGE_SPEED_KMH = 30;
  
  // Centro de Zipaquirá como punto de inicio
  let currentLat = 5.0214;
  let currentLng = -73.9919;
  
  console.log('🏁 Inicio: Centro de Zipaquirá (5.0214, -73.9919)\n');
  
  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i];
    const distance = calculateDistance(
      currentLat,
      currentLng,
      apt.location.latitude,
      apt.location.longitude
    );
    const travelTime = (distance / AVERAGE_SPEED_KMH) * 60; // minutos
    
    totalDistance += distance;
    totalTravelTime += travelTime;
    
    console.log(`${i + 1}. ${apt.customerName} - ${apt.serviceType} (${apt.estimatedDuration}min)`);
    console.log(`   📍 ${apt.locationName} - ${apt.location.address}`);
    console.log(`   🚗 Distancia: ${distance.toFixed(2)} km | Tiempo viaje: ${travelTime.toFixed(0)} min`);
    console.log(`   ⏰ Horario: ${apt.startTime.split('T')[1].substring(0, 5)}\n`);
    
    currentLat = apt.location.latitude;
    currentLng = apt.location.longitude;
  }
  
  // Distancia de regreso
  const returnDistance = calculateDistance(
    currentLat,
    currentLng,
    5.0214,
    -73.9919
  );
  totalDistance += returnDistance;
  totalTravelTime += (returnDistance / AVERAGE_SPEED_KMH) * 60;
  
  console.log(`🏁 Regreso al Centro: ${returnDistance.toFixed(2)} km\n`);
  console.log('═'.repeat(60));
  console.log(`📍 Distancia Total: ${totalDistance.toFixed(2)} km`);
  console.log(`⏱️  Tiempo de Viaje Total: ${totalTravelTime.toFixed(0)} minutos (${(totalTravelTime / 60).toFixed(1)} horas)`);
  console.log(`🎯 Potencial de Optimización: ALTO (ruta con muchos saltos)\n`);
}

/**
 * Script principal
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('🌱 SEED SCRIPT: Citas para Mañana (24 de octubre de 2025)');
  console.log('═'.repeat(60));
  console.log('\n📋 Características:');
  console.log('   ✓ Múltiples comercios y sedes en Zipaquirá');
  console.log('   ✓ Ruta NO óptima (saltos geográficos)');
  console.log('   ✓ Diferentes duraciones de servicios (15-150 min)');
  console.log('   ✓ 8 citas distribuidas en el día\n');
  
  try {
    // 1. Eliminar citas existentes
    await deleteAllAppointments();
    
    // 2. Crear citas con ruta NO óptima
    const appointments = await createNonOptimalAppointments();
    
    // 3. Mostrar estadísticas
    showRouteStatistics(appointments);
    
    console.log('✅ Seed completado exitosamente!\n');
    console.log('🎯 Próximos pasos:');
    console.log('   1. Ve a localhost:3000/dashboard');
    console.log('   2. Haz clic en "Optimizar Ruta"');
    console.log('   3. Compara la ruta actual (NO óptima) vs la optimizada');
    console.log('   4. Verifica la columna "Duración" en la tabla\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    throw error;
  }
}

main();
