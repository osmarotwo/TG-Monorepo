/**
 * Script para probar la prevención de conflictos de citas
 * Simula el flujo completo:
 * 1. Crear una cita personal a las 13:00
 * 2. Consultar disponibilidad para 18/11/2025 a las 13:00
 * 3. Verificar que el slot 13:00 NO aparezca como disponible
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const AVAILABILITY_TABLE = 'Availability';
const TEST_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'; // Tu userId real
const TEST_DATE = '2025-11-18';
const TEST_TIME = '13:00';
const TEST_LOCATION = 'LOC001'; // Salón Aurora - Chapinero

async function testConflictPrevention() {
  console.log('🧪 Iniciando prueba de prevención de conflictos...\n');

  // Paso 1: Crear una cita personal a las 13:00
  console.log('📝 Paso 1: Creando cita personal a las 13:00...');
  const personalAppointment = {
    PK: `USER#${TEST_USER_ID}`,
    SK: `APPOINTMENT#${TEST_DATE}T${TEST_TIME}:00.000Z#personal-test`,
    appointmentId: 'personal-test-' + Date.now(),
    userId: TEST_USER_ID,
    type: 'personal',
    title: 'Test - Cita Personal',
    description: 'Cita de prueba para verificar prevención de conflictos',
    startTime: `${TEST_DATE}T${TEST_TIME}:00.000Z`,
    endTime: `${TEST_DATE}T14:00:00.000Z`,
    duration: 60,
    time: TEST_TIME,
    location: 'Ubicación de prueba',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  try {
    await docClient.send(new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: personalAppointment,
    }));
    console.log('✅ Cita personal creada exitosamente\n');
  } catch (error) {
    console.error('❌ Error creando cita personal:', error);
    return;
  }

  // Paso 2: Consultar disponibilidad para LOC001 el 18/11/2025
  console.log('🔍 Paso 2: Consultando disponibilidad en Salón Aurora - Chapinero...');
  console.log(`   📅 Fecha: ${TEST_DATE}`);
  console.log(`   📍 Ubicación: ${TEST_LOCATION}`);
  console.log(`   👤 Usuario: ${TEST_USER_ID}\n`);

  // 2a. Obtener horarios disponibles del especialista
  const availabilityResult = await docClient.send(new QueryCommand({
    TableName: AVAILABILITY_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `DATE#${TEST_DATE}#LOCATION#${TEST_LOCATION}`,
      ':sk': 'SPECIALIST#',
    },
  }));

  console.log(`   Especialistas encontrados: ${availabilityResult.Items?.length || 0}`);

  // 2b. Obtener citas del usuario en esa fecha
  const userAppointmentsResult = await docClient.send(new QueryCommand({
    TableName: APPOINTMENTS_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${TEST_USER_ID}`,
      ':sk': `APPOINTMENT#${TEST_DATE}`,
    },
  }));

  const userAppointments = userAppointmentsResult.Items || [];
  console.log(`   Citas del usuario en ${TEST_DATE}: ${userAppointments.length}`);
  userAppointments.forEach((apt: any) => {
    const time = apt.time || apt.startTime;
    const title = apt.title || apt.serviceType || 'Sin título';
    const type = apt.type || 'business';
    console.log(`     - [${type.toUpperCase()}] ${title} a las ${time}`);
  });
  console.log('');

  // Paso 3: Simular el bloqueo de slots
  console.log('🚫 Paso 3: Verificando bloqueo de slots...\n');

  const bookedTimes = new Set<string>();

  // Marcar slots ocupados por citas del usuario
  for (const apt of userAppointments) {
    let startTimeStr = apt.time || apt.startTime;
    
    // Convertir ISO a HH:MM si es necesario
    if (startTimeStr && startTimeStr.includes('T')) {
      const startDate = new Date(startTimeStr);
      const hours = startDate.getUTCHours() - 5; // Colombia UTC-5
      const minutes = startDate.getUTCMinutes();
      startTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    const duration = apt.duration || 60;
    const slotsOccupied = Math.ceil(duration / 15);
    
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    
    for (let i = 0; i < slotsOccupied; i++) {
      const slotHours = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const slotMins = (currentMinutes % 60).toString().padStart(2, '0');
      const timeSlot = `${slotHours}:${slotMins}`;
      bookedTimes.add(timeSlot);
      console.log(`   🚫 Bloqueando ${timeSlot} (cita del usuario: ${apt.title || 'cita de negocio'})`);
      currentMinutes += 15;
    }
  }

  // Paso 4: Verificar si 13:00 está bloqueado
  console.log('\n✅ Resultado de la prueba:');
  if (bookedTimes.has(TEST_TIME)) {
    console.log(`   ✅ CORRECTO: El slot ${TEST_TIME} está bloqueado`);
    console.log(`   ✅ El usuario NO debería poder reservar a las ${TEST_TIME}`);
  } else {
    console.log(`   ❌ ERROR: El slot ${TEST_TIME} NO está bloqueado`);
    console.log(`   ❌ El usuario PODRÍA reservar a las ${TEST_TIME} (BUG)`);
  }

  console.log('\n📊 Resumen:');
  console.log(`   - Citas del usuario: ${userAppointments.length}`);
  console.log(`   - Slots bloqueados: ${bookedTimes.size}`);
  console.log(`   - Slots bloqueados: [${Array.from(bookedTimes).sort().join(', ')}]`);
}

// Ejecutar prueba
testConflictPrevention()
  .then(() => {
    console.log('\n✨ Prueba completada!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en la prueba:', error);
    process.exit(1);
  });
