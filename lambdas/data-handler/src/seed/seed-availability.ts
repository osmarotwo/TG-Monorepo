/**
 * Seed de datos de disponibilidad para pruebas
 * 
 * Crea:
 * - Horarios de operación para 5 ubicaciones (LOC001-LOC005)
 * - 6 tipos de servicios con duraciones
 * - 6 especialistas con sus agendas
 * - Slots disponibles para 12-15 noviembre 2025
 * - Horario: 8:00 AM - 8:00 PM (slots cada 15 minutos)
 * - ~80% disponibles, ~15% reservados, ~5% ocupados
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
  BusinessHours,
  ServiceDuration,
  SpecialistSchedule,
  AvailabilitySlots
} from '../types/availability';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

// IDs de las ubicaciones existentes (alineados con la tabla Locations real)
const LOCATION_IDS = [
  'LOC-CENTRO-ZIP',   // Salón de Belleza Centro
  'LOC-SUR-ZIP',      // Sede Sur
  'LOC-NORTE-ZIP',    // Sede Norte
  'LOC-OESTE-ZIP',    // Sede Oeste
  'LOC-ESTE-ZIP',     // Sede Este
];

const LOCATION_NAMES = [
  'Salón de Belleza Centro',
  'Sede Sur',
  'Sede Norte',
  'Sede Oeste',
  'Sede Este'
];

// Días de la semana
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Tipos de servicios (alineados con /nextjs-app/src/data/services.ts)
const SERVICES: Omit<ServiceDuration, 'PK' | 'SK' | 'createdAt' | 'updatedAt'>[] = [
  {
    serviceType: 'Corte de Cabello',
    displayName: 'Corte de Cabello',
    durationMinutes: 60,
    description: 'Corte personalizado con lavado',
    basePrice: 35000
  },
  {
    serviceType: 'Tinte',
    displayName: 'Tinte',
    durationMinutes: 90,
    description: 'Coloración completa',
    basePrice: 85000
  },
  {
    serviceType: 'Peinado',
    displayName: 'Peinado',
    durationMinutes: 45,
    description: 'Peinado para evento',
    basePrice: 45000
  },
  {
    serviceType: 'Manicure',
    displayName: 'Manicure',
    durationMinutes: 45,
    description: 'Manicure clásico',
    basePrice: 25000
  },
  {
    serviceType: 'Pedicure',
    displayName: 'Pedicure',
    durationMinutes: 60,
    description: 'Pedicure completo',
    basePrice: 30000
  },
  {
    serviceType: 'Masaje Facial',
    displayName: 'Masaje Facial',
    durationMinutes: 30,
    description: 'Masaje facial relajante',
    basePrice: 40000
  }
];

// Especialistas
const SPECIALISTS = [
  { id: 'spec-001', name: 'Carlos Martínez', locations: ['LOC001', 'LOC003'] },
  { id: 'spec-002', name: 'Ana López', locations: ['LOC002', 'LOC004'] },
  { id: 'spec-003', name: 'Juan Rodríguez', locations: ['LOC005'] },
  { id: 'spec-004', name: 'María García', locations: ['LOC001', 'LOC002'] },
  { id: 'spec-005', name: 'Pedro Sánchez', locations: ['LOC003', 'LOC004'] },
  { id: 'spec-006', name: 'Laura Torres', locations: ['LOC005', 'LOC001'] }
];

/**
 * Genera slots de disponibilidad de 8 AM a 8 PM (cada 15 min)
 * Por defecto todos disponibles, excepto algunos reservados al azar
 */
function generateAvailabilitySlots(): AvailabilitySlots {
  const slots: AvailabilitySlots = {};
  
  // De 8:00 AM a 8:00 PM (12 horas = 48 slots de 15 min)
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // 80% disponible, 15% reservado, 5% ya ocupado
      const rand = Math.random();
      if (rand < 0.8) {
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
 * Crea horarios de operación para todas las ubicaciones
 */
async function seedBusinessHours(): Promise<void> {
  console.log('📅 Creando horarios de operación...');
  
  const items: BusinessHours[] = [];
  const now = new Date().toISOString();
  
  for (const locationId of LOCATION_IDS) {
    for (const day of DAYS_OF_WEEK) {
      items.push({
        PK: `LOCATION#${locationId}`,
        SK: `HOURS#${day}`,
        locationId,
        dayOfWeek: day,
        openTime: '08:00',
        closeTime: '20:00',
        isOpen: true,
        createdAt: now,
        updatedAt: now
      });
    }
  }
  
  // Batch write (25 items a la vez)
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [AVAILABILITY_TABLE]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    }));
  }
  
  console.log(`✅ Creados ${items.length} horarios de operación`);
}

/**
 * Crea tipos de servicios con sus duraciones
 */
async function seedServiceDurations(): Promise<void> {
  console.log('💇 Creando tipos de servicios...');
  
  const items: ServiceDuration[] = [];
  const now = new Date().toISOString();
  
  for (const service of SERVICES) {
    items.push({
      PK: `SERVICE#${service.serviceType}`,
      SK: 'METADATA',
      ...service,
      createdAt: now,
      updatedAt: now
    });
  }
  
  await docClient.send(new BatchWriteCommand({
    RequestItems: {
      [AVAILABILITY_TABLE]: items.map(item => ({
        PutRequest: { Item: item }
      }))
    }
  }));
  
  console.log(`✅ Creados ${items.length} tipos de servicios`);
}

/**
 * Crea agendas de especialistas para los próximos 4 días
 */
async function seedSpecialistSchedules(): Promise<void> {
  console.log('👨‍💼 Creando agendas de especialistas...');
  
  const items: SpecialistSchedule[] = [];
  const now = new Date().toISOString();
  
  // Crear disponibilidad para los próximos 4 días (12-15 de noviembre de 2025)
  const dates = ['2025-11-12', '2025-11-13', '2025-11-14', '2025-11-15'];
  
  for (const date of dates) {
    for (const specialist of SPECIALISTS) {
      for (const locationId of specialist.locations) {
        items.push({
          PK: `SPECIALIST#${specialist.id}`,
          SK: `DATE#${date}#LOCATION#${locationId}`,
          GSI1PK: `DATE#${date}#LOCATION#${locationId}`, // Para consultar por ubicación y fecha
          GSI1SK: `SPECIALIST#${specialist.id}`,
          GSI2PK: `SPECIALIST#${specialist.id}`, // Para consultar por especialista
          GSI2SK: `DATE#${date}`,
          specialistId: specialist.id,
          specialistName: specialist.name,
          locationId,
          date,
          availability: generateAvailabilitySlots(),
          createdAt: now,
          updatedAt: now
        } as any);
      }
    }
  }
  
  // Batch write
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [AVAILABILITY_TABLE]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    }));
  }
  
  console.log(`✅ Creadas ${items.length} agendas de especialistas para ${dates.join(', ')}`);
}

/**
 * Ejecuta todo el seed
 */
async function main() {
  console.log('🌱 Iniciando seed de disponibilidad...\n');
  
  try {
    await seedBusinessHours();
    await seedServiceDurations();
    await seedSpecialistSchedules();
    
    console.log('\n✨ Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - ${LOCATION_IDS.length} ubicaciones con horarios (LOC001-LOC005)`);
    console.log(`   - ${SERVICES.length} tipos de servicios`);
    console.log(`   - ${SPECIALISTS.length} especialistas`);
    console.log(`   - Slots disponibles para: 12-15 noviembre 2025`);
    console.log(`   - Horario: 8:00 AM - 8:00 PM (slots cada 15 min)`);
    console.log(`   - ~80% slots disponibles, ~15% reservados, ~5% ocupados\n`);
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { main as seedAvailability };
