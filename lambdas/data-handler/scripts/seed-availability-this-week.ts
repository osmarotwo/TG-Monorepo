/**
 * Script para generar disponibilidad para el resto de la semana actual
 * Fecha: 18-23 de noviembre de 2025
 * 
 * Genera:
 * - Slots disponibles para todas las ubicaciones
 * - Horario: 8:00 AM - 8:00 PM
 * - Slots cada 30 minutos
 * - ~90% disponibles para que el usuario pueda agendar fácilmente
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

// Ubicaciones existentes (basadas en los IDs reales)
const LOCATIONS = [
  { id: 'LOC-CENTRO-ZIP', name: 'Salón de Belleza Centro' },
  { id: 'LOC-SUR-ZIP', name: 'Sede Sur' },
  { id: 'LOC-NORTE-ZIP', name: 'Sede Norte' },
  { id: 'LOC-OESTE-ZIP', name: 'Sede Oeste' },
  { id: 'LOC-ESTE-ZIP', name: 'Sede Este' },
];

// Servicios disponibles
const SERVICES = [
  { type: 'Corte de Cabello', duration: 60 },
  { type: 'Tinte', duration: 90 },
  { type: 'Peinado', duration: 45 },
  { type: 'Manicure', duration: 45 },
  { type: 'Pedicure', duration: 60 },
  { type: 'Masaje Facial', duration: 30 }
];

// Especialistas
const SPECIALISTS = [
  { id: 'SPEC-001', name: 'Carlos Martínez' },
  { id: 'SPEC-002', name: 'Ana López' },
  { id: 'SPEC-003', name: 'Juan Rodríguez' },
  { id: 'SPEC-004', name: 'María García' },
  { id: 'SPEC-005', name: 'Pedro Sánchez' },
  { id: 'SPEC-006', name: 'Laura Torres' }
];

// Función para generar timestamps de slots
function generateTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const startHour = 8; // 8:00 AM
  const endHour = 20; // 8:00 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, minute, 0, 0);
      slots.push(slotDate.toISOString());
    }
  }
  
  return slots;
}

// Función para obtener fechas de esta semana (18-23 nov)
function getThisWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date('2025-11-18T00:00:00.000Z'); // Lunes 18
  
  for (let i = 0; i < 6; i++) { // Lunes a Sábado
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

// Función para determinar si un slot está disponible (90% disponibles)
function isSlotAvailable(): boolean {
  return Math.random() < 0.90;
}

async function seedAvailability() {
  console.log('🌱 Iniciando seed de disponibilidad para esta semana...');
  console.log(`📅 Fechas: 18-23 de noviembre de 2025`);
  console.log(`🏢 Ubicaciones: ${LOCATIONS.length}`);
  console.log(`👥 Especialistas: ${SPECIALISTS.length}`);
  
  const dates = getThisWeekDates();
  let totalSlots = 0;
  let availableSlots = 0;
  
  // Para cada ubicación
  for (const location of LOCATIONS) {
    console.log(`\n📍 Procesando ubicación: ${location.name} (${location.id})`);
    
    // Para cada especialista
    for (const specialist of SPECIALISTS) {
      console.log(`  👤 Especialista: ${specialist.name}`);
      
      // Para cada fecha
      for (const date of dates) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('es', { weekday: 'long' });
        
        // Generar slots para el día
        const timeSlots = generateTimeSlots(date);
        
        // Crear documento de disponibilidad para el día
        const availabilityDoc = {
          PK: `LOCATION#${location.id}`,
          SK: `AVAILABILITY#${specialist.id}#${dateStr}`,
          locationId: location.id,
          locationName: location.name,
          specialistId: specialist.id,
          specialistName: specialist.name,
          date: dateStr,
          dayOfWeek: dayName,
          slots: timeSlots.map(timestamp => {
            const isAvailable = isSlotAvailable();
            totalSlots++;
            if (isAvailable) availableSlots++;
            
            return {
              timestamp,
              status: isAvailable ? 'available' : 'booked',
              duration: 30
            };
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          entityType: 'AVAILABILITY'
        };
        
        // Guardar en DynamoDB
        try {
          await docClient.send(new PutCommand({
            TableName: AVAILABILITY_TABLE,
            Item: availabilityDoc
          }));
        } catch (error) {
          console.error(`    ❌ Error guardando disponibilidad: ${error}`);
        }
      }
    }
  }
  
  console.log(`\n✅ Seed completado!`);
  console.log(`📊 Estadísticas:`);
  console.log(`   - Total de slots generados: ${totalSlots}`);
  console.log(`   - Slots disponibles: ${availableSlots} (${((availableSlots/totalSlots)*100).toFixed(1)}%)`);
  console.log(`   - Slots reservados: ${totalSlots - availableSlots} (${(((totalSlots - availableSlots)/totalSlots)*100).toFixed(1)}%)`);
  console.log(`   - Ubicaciones: ${LOCATIONS.length}`);
  console.log(`   - Especialistas: ${SPECIALISTS.length}`);
  console.log(`   - Días: ${dates.length}`);
}

// Ejecutar seed
seedAvailability()
  .then(() => {
    console.log('\n🎉 Disponibilidad generada exitosamente!');
    console.log('Ahora puedes agendar citas en las ubicaciones para esta semana.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  });
