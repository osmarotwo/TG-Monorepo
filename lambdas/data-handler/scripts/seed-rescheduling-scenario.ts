import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';
const USER_ID = 'user-123';

// Ruta geográficamente óptima: Zipaquirá → Chía → Cajicá → Sopó (cercanos)
// PERO con horarios IMPOSIBLES (no hay tiempo para viajar)
const APPOINTMENTS = [
  {
    locationId: 'LOC-CENTRO-ZIP',
    locationName: 'Salón de Belleza Centro',
    city: 'Zipaquirá',
    time: '09:00',
    duration: 30, // Termina 09:30
    service: 'Corte de cabello',
    specialist: 'María Pérez',
  },
  {
    locationId: 'LOC-CHIA', // 15km de Zipaquirá (20min viaje)
    locationName: 'Spa Relax Chía',
    city: 'Chía',
    time: '09:40', // CONFLICTO: Solo 10min después, necesita 20min viaje
    duration: 60,
    service: 'Masaje relajante',
    specialist: 'Carlos Rodríguez',
  },
  {
    locationId: 'LOC-CAJICA', // 5km de Chía (8min viaje)
    locationName: 'Peluquería Moderna Cajicá',
    city: 'Cajicá',
    time: '10:45', // CONFLICTO: Solo 5min después, necesita 8min viaje
    duration: 45,
    service: 'Manicure',
    specialist: 'Ana Martínez',
  },
  {
    locationId: 'LOC-SOPO', // 12km de Cajicá (15min viaje)
    locationName: 'Spa Relax Sopó',
    city: 'Sopó',
    time: '11:35', // CONFLICTO: Solo 5min después, necesita 15min viaje
    duration: 60,
    service: 'Pedicure',
    specialist: 'Laura Gómez',
  },
  {
    locationId: 'LOC-TABIO', // 18km de Sopó (22min viaje)
    locationName: 'Salón de Belleza Tabio',
    city: 'Tabio',
    time: '12:40', // CONFLICTO: Solo 5min después, necesita 22min viaje
    duration: 120,
    service: 'Keratina',
    specialist: 'Pedro López',
  },
  {
    locationId: 'LOC-TOCANCIPA', // 20km de Tabio (25min viaje)
    locationName: 'Estética Bella Tocancipá',
    city: 'Tocancipá',
    time: '14:50', // CONFLICTO: Solo 10min después, necesita 25min viaje
    duration: 150,
    service: 'Balayage',
    specialist: 'Sofía Castro',
  },
  {
    locationId: 'LOC-COGUA', // 16km de Tocancipá (20min viaje)
    locationName: 'Barbería Clásica Cogua',
    city: 'Cogua',
    time: '17:25', // CONFLICTO: Solo 5min después, necesita 20min viaje
    duration: 20,
    service: 'Arreglo de barba',
    specialist: 'Miguel Ángel',
  },
  {
    locationId: 'LOC-NEMOCON', // 14km de Cogua (18min viaje)
    locationName: 'Salón Elite Nemocón',
    city: 'Nemocón',
    time: '17:50', // CONFLICTO: Solo 5min después, necesita 18min viaje
    duration: 90,
    service: 'Facial',
    specialist: 'Diana Torres',
  },
];

async function seedAppointments() {
  console.log('📅 Creando escenario de REPROGRAMACIÓN (horarios conflictivos)...\n');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  for (const apt of APPOINTMENTS) {
    const appointmentId = `APT-${uuidv4().substring(0, 8)}`;
    const startDateTime = new Date(`${dateStr}T${apt.time}:00`);
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
        serviceType: apt.service,
        specialistId: 'SPEC-001',
        specialistName: apt.specialist,
        status: 'confirmed',
        resourceId: 'RES-001',
        date: dateStr,
        time: apt.time,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        estimatedDuration: apt.duration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));

    console.log(`📍 ${apt.time} - ${apt.service} (${apt.duration}min) @ ${apt.locationName} (${apt.city})`);
  }

  console.log(`\n✅ ${APPOINTMENTS.length} citas creadas con horarios CONFLICTIVOS`);
  console.log(`\n⚠️  PROBLEMA: Tiempos de viaje NO considerados en horarios`);
  console.log(`📊 Optimización deberá REPROGRAMAR horarios para ajustar tiempos de viaje`);
}

seedAppointments().catch(console.error);
