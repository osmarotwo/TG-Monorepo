/**
 * Script para ACTUALIZAR las citas existentes con roles correctos:
 * - Valerie es el CLIENTE (userId, clientName)
 * - Los especialistas son otros usuarios que la atienden
 * 
 * DISEÑO CORRECTO:
 * Cliente (Valerie) → agenda APPOINTMENT → en BUSINESS → en LOCATION → con SPECIALIST
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';

// Valerie es el CLIENTE
const CLIENT_USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616';
const CLIENT_NAME = 'Valerie Sofia Martinez';

// Especialistas ficticios que atienden a Valerie
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

async function fixAppointmentRoles() {
  console.log('═'.repeat(70));
  console.log('🔧 ACTUALIZANDO: Roles correctos en Appointments');
  console.log('═'.repeat(70));
  console.log(`\n👤 CLIENTE: ${CLIENT_NAME} (${CLIENT_USER_ID})`);
  console.log(`👨‍💼 ESPECIALISTAS: ${SPECIALISTS.length} diferentes\n`);

  // 1. Obtener todas las citas de Valerie
  const scanResult = await docClient.send(new ScanCommand({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${CLIENT_USER_ID}`
    }
  }));

  const appointments = scanResult.Items || [];
  console.log(`📊 Citas encontradas: ${appointments.length}\n`);

  // 2. Actualizar cada cita con roles correctos
  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];
    const specialist = SPECIALISTS[i % SPECIALISTS.length]; // Rotar especialistas

    console.log(`📝 Actualizando cita ${i + 1}/${appointments.length}:`);
    console.log(`   ID: ${appointment.SK}`);
    console.log(`   Servicio: ${appointment.serviceName}`);
    console.log(`   Hora: ${appointment.time}`);

    await docClient.send(new UpdateCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: {
        PK: appointment.PK,
        SK: appointment.SK
      },
      UpdateExpression: `
        SET 
          userId = :userId,
          clientName = :clientName,
          specialistId = :specialistId,
          specialistName = :specialistName
        REMOVE clientPhone
      `,
      ExpressionAttributeValues: {
        ':userId': CLIENT_USER_ID,
        ':clientName': CLIENT_NAME,
        ':specialistId': specialist.id,
        ':specialistName': specialist.name
      }
    }));

    console.log(`   ✅ Cliente: ${CLIENT_NAME}`);
    console.log(`   ✅ Especialista: ${specialist.name} (${specialist.id})`);
    console.log('');
  }

  console.log('═'.repeat(70));
  console.log('✅ ACTUALIZACIÓN COMPLETADA');
  console.log('═'.repeat(70));
  console.log(`\n📝 Resumen:`);
  console.log(`   • ${appointments.length} citas actualizadas`);
  console.log(`   • Cliente: ${CLIENT_NAME} (usuario final)`);
  console.log(`   • Especialistas: ${SPECIALISTS.length} diferentes atendiendo`);
  console.log(`   • Estructura: Cliente → Negocio → Sede → Especialista ✅\n`);
}

fixAppointmentRoles().catch(console.error);
