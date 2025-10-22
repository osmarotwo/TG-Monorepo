/**
 * Script para crear 4 citas con RUTA SUB-ÓPTIMA que requiere REPROGRAMACIÓN
 * 
 * Escenario:
 * 1. Norte (09:00) → Sur (10:00) → Este (11:00) → Oeste (12:00)
 *    Orden geográfico PÉSIMO con mucho cruce
 * 
 * 2. Algoritmo debería proponer:
 *    Norte → Este → Sur → Oeste (orden lógico)
 *    CON cambios de horario para respetar disponibilidad de negocios
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'; // Valerie

// 4 citas con RUTA SUB-ÓPTIMA (mucho cruce entre zonas)
// Orden actual: Norte → Sur → Este → Oeste (PÉSIMO)
// Orden óptimo: Norte → Este → Sur → Oeste (menos cruce)
const APPOINTMENTS = [
  {
    locationId: 'LOC-NORTE-ZIP',
    locationName: 'Salón Norte',
    time: '09:00',
    duration: 45, // Termina 09:45
    service: 'Corte de cabello',
    specialist: 'María González',
    businessId: 'BIZ-SALON-BELLEZA',
    notes: 'Primera cita - Zona Norte',
  },
  {
    locationId: 'LOC-SUR-ZIP',
    locationName: 'Salón Sur',
    time: '10:00', // Requiere viajar de Norte a Sur (~15min)
    duration: 60, // Termina 11:00
    service: 'Tinte completo',
    specialist: 'Carlos Rodríguez',
    businessId: 'BIZ-SALON-BELLEZA',
    notes: '⚠️ SUB-ÓPTIMO: Ir al Sur cuando Este está más cerca de Norte',
  },
  {
    locationId: 'LOC-ESTE-ZIP',
    locationName: 'Salón Este',
    time: '11:15', // Requiere volver de Sur a Este (~12min)
    duration: 45, // Termina 12:00
    service: 'Manicure',
    specialist: 'Ana Martínez',
    businessId: 'BIZ-SALON-BELLEZA',
    notes: '⚠️ SUB-ÓPTIMO: Debió ser la 2da cita (cercana a Norte)',
  },
  {
    locationId: 'LOC-OESTE-ZIP',
    locationName: 'Salón Oeste',
    time: '12:30', // Requiere ir de Este a Oeste (~18min)
    duration: 90, // Termina 14:00
    service: 'Keratina',
    specialist: 'Laura Gómez',
    businessId: 'BIZ-SALON-BELLEZA',
    notes: '⚠️ SUB-ÓPTIMO: Cruce completo de la ciudad',
  },
];

async function deleteAllAppointments() {
  console.log('🗑️  Borrando todas las citas existentes...\n');

  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    ProjectionExpression: 'PK, SK',
  }));

  const items = scanResult.Items || [];
  
  if (items.length === 0) {
    console.log('✅ No hay citas para borrar.\n');
    return;
  }

  const deleteRequests = items.map(item => ({
    DeleteRequest: {
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
    },
  }));

  const batchSize = 25;
  for (let i = 0; i < deleteRequests.length; i += batchSize) {
    const batch = deleteRequests.slice(i, i + batchSize);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [APPOINTMENTS_TABLE]: batch,
      },
    }));
  }

  console.log(`✅ ${items.length} citas eliminadas.\n`);
}

async function seedAppointments() {
  console.log('📅 Creando 4 citas con RUTA SUB-ÓPTIMA...\n');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  console.log('📍 Ruta ACTUAL (sub-óptima):');
  console.log('   1️⃣ Norte (09:00)');
  console.log('   2️⃣ Sur (10:00) ⚠️ Cruce innecesario');
  console.log('   3️⃣ Este (11:15) ⚠️ Regreso al norte');
  console.log('   4️⃣ Oeste (12:30) ⚠️ Cruce completo\n');

  console.log('🎯 Ruta ÓPTIMA esperada:');
  console.log('   1️⃣ Norte (09:00)');
  console.log('   2️⃣ Este (09:50) ✅ Cercano a Norte');
  console.log('   3️⃣ Sur (10:40) ✅ En el camino');
  console.log('   4️⃣ Oeste (11:45) ✅ Cierra el circuito\n');

  for (const apt of APPOINTMENTS) {
    const appointmentId = `APT-${uuidv4().substring(0, 8)}`;
    const startDateTime = new Date(`${dateStr}T${apt.time}:00-05:00`);
    const endDateTime = new Date(startDateTime.getTime() + apt.duration * 60 * 1000);

    await docClient.send(new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: {
        PK: `USER#${USER_ID}`,
        SK: `APPOINTMENT#${appointmentId}`,
        appointmentId,
        userId: USER_ID,
        businessId: apt.businessId,
        locationId: apt.locationId,
        locationName: apt.locationName,
        customerId: USER_ID, // Valerie ES el cliente
        customerName: 'Valerie Smith', // Nombre del cliente (Valerie)
        customerPhone: '+57 300 123 4567',
        serviceType: apt.service,
        specialistId: 'SPEC-001',
        specialistName: apt.specialist,
        businessName: 'Salón de Belleza Premium', // Nombre del comercio
        status: 'confirmed',
        resourceId: 'RES-001',
        date: dateStr,
        time: apt.time,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: apt.duration,
        notes: apt.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));

    console.log(`📍 ${apt.time} - ${apt.service} (${apt.duration}min) @ ${apt.locationName}`);
  }

  console.log(`\n✅ ${APPOINTMENTS.length} citas creadas con RUTA SUB-ÓPTIMA\n`);
  console.log('🎯 Esperado: Algoritmo reordenará y ajustará horarios');
  console.log('📊 Mejora estimada: 30-40% en tiempo de viaje\n');
}

async function main() {
  try {
    await deleteAllAppointments();
    await seedAppointments();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
