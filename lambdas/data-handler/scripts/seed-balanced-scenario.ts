import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'; // Valerie (cliente)

// Escenario BALANCEADO usando LOCATIONS REALES:
// - 3 citas alcanzables (sin conflictos)
// - 3 citas con conflictos MODERADOS (requieren reprogramación)
// TODAS las locations están en Zipaquirá pero en diferentes zonas
const APPOINTMENTS = [
  {
    locationId: 'LOC-CENTRO-ZIP', // REAL
    locationName: 'Salón de Belleza Centro',
    time: '09:00',
    duration: 30, // Termina 09:30
    service: 'Corte de cabello',
    specialist: 'María González',
    notes: 'Primera cita del día',
  },
  {
    locationId: 'LOC-NORTE-ZIP', // REAL - Cerca del Centro
    locationName: 'Spa Relax Norte',
    time: '10:00', // ✅ ALCANZABLE: 30min después (suficiente para ~10min viaje)
    duration: 45, // Termina 10:45
    service: 'Manicure',
    specialist: 'Carlos Rodríguez',
    notes: 'Cliente frecuente',
  },
  {
    locationId: 'LOC-SUR-ZIP', // REAL - Lejos del Norte (~15min)
    locationName: 'Peluquería Moderna Sur',
    time: '11:00', // ⚠️ CONFLICTO: Solo 15min después, necesita ~15min de viaje = muy justo
    duration: 60, // Termina 12:00
    service: 'Masaje relajante',
    specialist: 'Ana Martínez',
    notes: 'Requiere aceites especiales',
  },
  {
    locationId: 'LOC-ESTE-ZIP', // REAL - Cerca del Sur
    locationName: 'Estética Bella Este',
    time: '12:30', // ✅ ALCANZABLE: 30min después (suficiente para ~8min viaje)
    duration: 45, // Termina 13:15
    service: 'Pedicure',
    specialist: 'Laura Gómez',
    notes: 'Esmalte gel',
  },
  {
    locationId: 'LOC-OESTE-ZIP', // REAL - Lejos del Este (~20min)
    locationName: 'Spa Relax Oeste',
    time: '13:30', // ⚠️ CONFLICTO: Solo 15min después, necesita ~20min de viaje
    duration: 90, // Termina 15:00
    service: 'Keratina',
    specialist: 'Pedro López',
    notes: 'Tratamiento premium',
  },
  {
    locationId: 'LOC-CATEDRAL-ZIP', // REAL - Lejos del Oeste (~18min)
    locationName: 'Salón Elite Catedral',
    time: '15:15', // ⚠️ CONFLICTO: Solo 15min después, necesita ~18min de viaje
    duration: 120, // Termina 17:15
    service: 'Balayage',
    specialist: 'Sofía Castro',
    notes: 'Color rubio miel',
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
  console.log('📅 Creando escenario BALANCEADO (3 alcanzables + 3 con conflictos)...\n');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

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
        businessId: 'BIZ-SALON-BELLEZA',
        locationId: apt.locationId,
        locationName: apt.locationName,
        customerId: 'CUST-001',
        customerName: 'Juan Cliente',
        customerPhone: '+57 300 000 0000',
        serviceType: apt.service,
        specialistId: 'SPEC-001',
        specialistName: apt.specialist,
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

    const statusIcon = apt.time === '10:00' || apt.time === '12:30' ? '✅' : '⚠️';
    console.log(`${statusIcon} ${apt.time} - ${apt.service} (${apt.duration}min) @ ${apt.locationName}`);
  }

  console.log(`\n✅ ${APPOINTMENTS.length} citas creadas exitosamente\n`);
  console.log('📊 Resumen:');
  console.log('  ✅ 3 citas alcanzables (sin conflictos de tiempo)');
  console.log('  ⚠️  3 citas con conflictos MODERADOS (requieren reprogramación)');
  console.log('\n🎯 Esperado: El algoritmo debería sugerir ajustar los horarios de las 3 citas conflictivas');
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
