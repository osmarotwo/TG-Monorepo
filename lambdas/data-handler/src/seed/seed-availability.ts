/**
 * Seed de datos de disponibilidad para pruebas
 * 
 * Crea:
 * - Horarios de operación para 5 ubicaciones
 * - 6 tipos de servicios con duraciones
 * - 6 especialistas con sus agendas
 * - Slots disponibles para mañana (22/10/2025)
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

// IDs de las ubicaciones existentes (de seed-optimizable-route.ts)
const LOCATION_IDS = [
  'loc-chapinero-001',
  'loc-chia-001',
  'loc-kennedy-001',
  'loc-usaquen-001',
  'loc-suba-001'
];

const LOCATION_NAMES = [
  'Barbería Chapinero',
  'Salón Chía Premium',
  'Estética Kennedy',
  'Hair Studio Usaquén',
  'Peluquería Suba'
];

// Días de la semana
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Tipos de servicios
const SERVICES: Omit<ServiceDuration, 'PK' | 'SK' | 'createdAt' | 'updatedAt'>[] = [
  {
    serviceType: 'haircut',
    displayName: 'Corte de Cabello',
    durationMinutes: 60,
    description: 'Corte personalizado con lavado',
    basePrice: 35000
  },
  {
    serviceType: 'keratin',
    displayName: 'Keratina',
    durationMinutes: 90,
    description: 'Tratamiento de keratina completo',
    basePrice: 180000
  },
  {
    serviceType: 'coloring',
    displayName: 'Tinte',
    durationMinutes: 120,
    description: 'Coloración completa con retoque de raíces',
    basePrice: 85000
  },
  {
    serviceType: 'beard',
    displayName: 'Barba',
    durationMinutes: 30,
    description: 'Arreglo y diseño de barba',
    basePrice: 25000
  },
  {
    serviceType: 'highlights',
    displayName: 'Mechas',
    durationMinutes: 90,
    description: 'Mechas estilo balayage',
    basePrice: 95000
  },
  {
    serviceType: 'treatment',
    displayName: 'Tratamiento Capilar',
    durationMinutes: 45,
    description: 'Hidratación profunda',
    basePrice: 45000
  }
];

// Especialistas
const SPECIALISTS = [
  { id: 'spec-001', name: 'Carlos Martínez', locations: ['loc-chapinero-001', 'loc-usaquen-001'] },
  { id: 'spec-002', name: 'Ana López', locations: ['loc-chia-001', 'loc-suba-001'] },
  { id: 'spec-003', name: 'Juan Rodríguez', locations: ['loc-kennedy-001'] },
  { id: 'spec-004', name: 'María García', locations: ['loc-chapinero-001', 'loc-chia-001'] },
  { id: 'spec-005', name: 'Pedro Sánchez', locations: ['loc-usaquen-001', 'loc-suba-001'] },
  { id: 'spec-006', name: 'Laura Torres', locations: ['loc-kennedy-001', 'loc-chapinero-001'] }
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
 * Crea agendas de especialistas para mañana (22/10/2025)
 */
async function seedSpecialistSchedules(): Promise<void> {
  console.log('👨‍💼 Creando agendas de especialistas...');
  
  const items: SpecialistSchedule[] = [];
  const now = new Date().toISOString();
  const tomorrow = '2025-10-22'; // Mañana
  
  for (const specialist of SPECIALISTS) {
    for (const locationId of specialist.locations) {
      items.push({
        PK: `SPECIALIST#${specialist.id}`,
        SK: `DATE#${tomorrow}#LOCATION#${locationId}`,
        GSI1PK: `DATE#${tomorrow}#LOCATION#${locationId}`, // Para consultar por ubicación y fecha
        GSI1SK: `SPECIALIST#${specialist.id}`,
        GSI2PK: `SPECIALIST#${specialist.id}`, // Para consultar por especialista
        GSI2SK: `DATE#${tomorrow}`,
        specialistId: specialist.id,
        specialistName: specialist.name,
        locationId,
        date: tomorrow,
        availability: generateAvailabilitySlots(),
        createdAt: now,
        updatedAt: now
      } as any);
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
  
  console.log(`✅ Creadas ${items.length} agendas de especialistas para ${tomorrow}`);
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
    console.log(`   - ${LOCATION_IDS.length} ubicaciones con horarios`);
    console.log(`   - ${SERVICES.length} tipos de servicios`);
    console.log(`   - ${SPECIALISTS.length} especialistas`);
    console.log(`   - Slots disponibles para: 2025-10-22\n`);
    
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
