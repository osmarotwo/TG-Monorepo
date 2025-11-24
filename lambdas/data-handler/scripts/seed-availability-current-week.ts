/**
 * Seed de disponibilidad para la semana actual
 * Genera disponibilidad desde HOY hasta 7 días después
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

// IDs de ubicaciones
const LOCATION_IDS = ['LOC001', 'LOC002', 'LOC003', 'LOC004', 'LOC005'];

// Especialistas
const SPECIALISTS = [
  { id: 'SPEC001', name: 'María García', locations: ['LOC001', 'LOC002'] },
  { id: 'SPEC002', name: 'Carlos López', locations: ['LOC001', 'LOC003'] },
  { id: 'SPEC003', name: 'Ana Martínez', locations: ['LOC002', 'LOC004'] },
  { id: 'SPEC004', name: 'Juan Rodríguez', locations: ['LOC003', 'LOC005'] },
  { id: 'SPEC005', name: 'Laura Sánchez', locations: ['LOC004', 'LOC001'] },
  { id: 'SPEC006', name: 'Pedro Gómez', locations: ['LOC005', 'LOC002'] }
];

/**
 * Genera slots de disponibilidad de 8 AM a 8 PM (cada 15 min)
 */
function generateAvailabilitySlots(): Record<string, 'available' | 'reserved' | 'booked'> {
  const slots: Record<string, 'available' | 'reserved' | 'booked'> = {};
  
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // 85% disponible, 10% reservado, 5% ocupado
      const rand = Math.random();
      if (rand < 0.85) {
        slots[time] = 'available';
      } else if (rand < 0.95) {
        slots[time] = 'reserved';
      } else {
        slots[time] = 'booked';
      }
    }
  }
  
  return slots;
}

/**
 * Genera fechas desde hoy hasta N días después
 */
function generateDates(daysAhead: number = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Crea agendas de especialistas
 */
async function seedSpecialistSchedules(): Promise<void> {
  console.log('🌱 Creando disponibilidad para la semana actual...\n');
  
  const dates = generateDates(7);
  console.log('📅 Fechas a crear:', dates.join(', '));
  
  const items: any[] = [];
  const now = new Date().toISOString();
  
  for (const date of dates) {
    for (const specialist of SPECIALISTS) {
      for (const locationId of specialist.locations) {
        items.push({
          PK: `SPECIALIST#${specialist.id}`,
          SK: `DATE#${date}#LOCATION#${locationId}`,
          GSI1PK: `DATE#${date}#LOCATION#${locationId}`,
          GSI1SK: `SPECIALIST#${specialist.id}`,
          GSI2PK: `SPECIALIST#${specialist.id}`,
          GSI2SK: `DATE#${date}`,
          specialistId: specialist.id,
          specialistName: specialist.name,
          locationId,
          date,
          availability: generateAvailabilitySlots(),
          createdAt: now,
          updatedAt: now
        });
      }
    }
  }
  
  console.log(`\n📦 Total de registros a crear: ${items.length}`);
  console.log('⏳ Guardando en DynamoDB...\n');
  
  // Batch write (máximo 25 items por batch)
  let saved = 0;
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [AVAILABILITY_TABLE]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    }));
    saved += batch.length;
    console.log(`  ✅ Guardados ${saved}/${items.length} registros`);
  }
  
  console.log(`\n✅ Seed completado exitosamente!`);
  console.log(`   - ${dates.length} fechas`);
  console.log(`   - ${SPECIALISTS.length} especialistas`);
  console.log(`   - ${LOCATION_IDS.length} ubicaciones`);
  console.log(`   - ${items.length} registros de disponibilidad`);
}

// Ejecutar
seedSpecialistSchedules()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
