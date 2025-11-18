/**
 * Script completo para generar disponibilidad para esta semana
 * Incluye:
 * - Horarios de operación de ubicaciones
 * - Horarios de especialistas
 * - Slots disponibles con alta disponibilidad
 * 
 * Fecha: 18-23 noviembre 2025
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

// Ubicaciones
const LOCATIONS = [
  { id: 'LOC-CENTRO-ZIP', name: 'Salón de Belleza Centro', businessId: 'BUS-ZIPS-001' },
  { id: 'LOC-SUR-ZIP', name: 'Sede Sur', businessId: 'BUS-ZIPS-001' },
  { id: 'LOC-NORTE-ZIP', name: 'Sede Norte', businessId: 'BUS-ZIPS-001' },
  { id: 'LOC-OESTE-ZIP', name: 'Sede Oeste', businessId: 'BUS-ZIPS-001' },
  { id: 'LOC-ESTE-ZIP', name: 'Sede Este', businessId: 'BUS-ZIPS-001' },
];

// Especialistas por ubicación
const SPECIALISTS_BY_LOCATION: Record<string, any[]> = {
  'LOC-CENTRO-ZIP': [
    { id: 'SPEC-001', name: 'Carlos Martínez', services: ['Corte de Cabello', 'Peinado'] },
    { id: 'SPEC-004', name: 'María García', services: ['Tinte', 'Masaje Facial'] }
  ],
  'LOC-SUR-ZIP': [
    { id: 'SPEC-002', name: 'Ana López', services: ['Manicure', 'Pedicure'] },
    { id: 'SPEC-004', name: 'María García', services: ['Tinte', 'Masaje Facial'] }
  ],
  'LOC-NORTE-ZIP': [
    { id: 'SPEC-001', name: 'Carlos Martínez', services: ['Corte de Cabello', 'Peinado'] },
    { id: 'SPEC-005', name: 'Pedro Sánchez', services: ['Corte de Cabello', 'Peinado'] }
  ],
  'LOC-OESTE-ZIP': [
    { id: 'SPEC-002', name: 'Ana López', services: ['Manicure', 'Pedicure'] },
    { id: 'SPEC-005', name: 'Pedro Sánchez', services: ['Corte de Cabello', 'Peinado'] }
  ],
  'LOC-ESTE-ZIP': [
    { id: 'SPEC-003', name: 'Juan Rodríguez', services: ['Corte de Cabello', 'Tinte'] },
    { id: 'SPEC-006', name: 'Laura Torres', services: ['Manicure', 'Pedicure', 'Masaje Facial'] }
  ]
};

// Horarios de operación (L-S: 8AM-8PM)
const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '20:00', isOpen: true },
  tuesday: { open: '08:00', close: '20:00', isOpen: true },
  wednesday: { open: '08:00', close: '20:00', isOpen: true },
  thursday: { open: '08:00', close: '20:00', isOpen: true },
  friday: { open: '08:00', close: '20:00', isOpen: true },
  saturday: { open: '08:00', close: '20:00', isOpen: true },
  sunday: { open: '00:00', close: '00:00', isOpen: false }
};

function generateTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const colombiaOffset = -5 * 60; // UTC-5
  
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotDate = new Date(date);
      slotDate.setUTCHours(hour - colombiaOffset / 60, minute, 0, 0);
      slots.push(slotDate.toISOString());
    }
  }
  
  return slots;
}

function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const startDate = new Date('2025-11-18T00:00:00-05:00'); // Lunes 18 en Colombia
  
  for (let i = 0; i < 6; i++) { // Lunes a Sábado
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

async function createBusinessHours(location: any) {
  const doc = {
    PK: `LOCATION#${location.id}`,
    SK: 'HOURS#BUSINESS',
    locationId: location.id,
    locationName: location.name,
    businessId: location.businessId,
    hours: BUSINESS_HOURS,
    timezone: 'America/Bogota',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entityType: 'BUSINESS_HOURS'
  };
  
  await docClient.send(new PutCommand({
    TableName: AVAILABILITY_TABLE,
    Item: doc
  }));
  
  console.log(`  ✅ Horarios de negocio creados`);
}

async function createSpecialistSchedule(location: any, specialist: any) {
  const doc = {
    PK: `LOCATION#${location.id}`,
    SK: `SCHEDULE#${specialist.id}`,
    locationId: location.id,
    locationName: location.name,
    specialistId: specialist.id,
    specialistName: specialist.name,
    services: specialist.services,
    weeklySchedule: {
      monday: { isAvailable: true, startTime: '08:00', endTime: '20:00' },
      tuesday: { isAvailable: true, startTime: '08:00', endTime: '20:00' },
      wednesday: { isAvailable: true, startTime: '08:00', endTime: '20:00' },
      thursday: { isAvailable: true, startTime: '08:00', endTime: '20:00' },
      friday: { isAvailable: true, startTime: '08:00', endTime: '20:00' },
      saturday: { isAvailable: true, startTime: '08:00', endTime: '20:00' },
      sunday: { isAvailable: false, startTime: '00:00', endTime: '00:00' }
    },
    timezone: 'America/Bogota',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entityType: 'SPECIALIST_SCHEDULE'
  };
  
  await docClient.send(new PutCommand({
    TableName: AVAILABILITY_TABLE,
    Item: doc
  }));
}

async function createDailyAvailability(location: any, specialist: any, date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = getDayOfWeek(date);
  const timeSlots = generateTimeSlots(date);
  
  const doc = {
    PK: `LOCATION#${location.id}`,
    SK: `AVAILABILITY#${specialist.id}#${dateStr}`,
    locationId: location.id,
    locationName: location.name,
    specialistId: specialist.id,
    specialistName: specialist.name,
    date: dateStr,
    dayOfWeek,
    slots: timeSlots.map((timestamp, index) => {
      // 95% disponibles, 5% ya reservados aleatoriamente
      const isAvailable = Math.random() > 0.05;
      
      return {
        timestamp,
        status: isAvailable ? 'available' : 'booked',
        duration: 30,
        ...(isAvailable ? {} : { 
          bookedBy: 'DEMO-USER-' + Math.floor(Math.random() * 100),
          serviceType: specialist.services[Math.floor(Math.random() * specialist.services.length)]
        })
      };
    }),
    timezone: 'America/Bogota',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entityType: 'AVAILABILITY'
  };
  
  await docClient.send(new PutCommand({
    TableName: AVAILABILITY_TABLE,
    Item: doc
  }));
}

async function seedCompleteAvailability() {
  console.log('🌱 Generando disponibilidad completa para esta semana...\n');
  console.log('📅 Periodo: 18-23 de noviembre de 2025 (Lunes a Sábado)');
  console.log('🕐 Horario: 8:00 AM - 8:00 PM');
  console.log('⏱️  Slots: Cada 30 minutos');
  console.log('📍 Ubicaciones: ' + LOCATIONS.length);
  console.log('');
  
  const dates = getWeekDates();
  let totalSlots = 0;
  let availableCount = 0;
  
  for (const location of LOCATIONS) {
    console.log(`\n📍 ${location.name} (${location.id})`);
    
    // Crear horarios de negocio
    await createBusinessHours(location);
    
    const specialists = SPECIALISTS_BY_LOCATION[location.id] || [];
    console.log(`   Especialistas: ${specialists.length}`);
    
    for (const specialist of specialists) {
      console.log(`   👤 ${specialist.name} - ${specialist.services.join(', ')}`);
      
      // Crear horario del especialista
      await createSpecialistSchedule(location, specialist);
      
      // Crear disponibilidad diaria
      for (const date of dates) {
        const dateStr = date.toISOString().split('T')[0];
        await createDailyAvailability(location, specialist, date);
        
        const slotsPerDay = 24; // 12 horas × 2 slots/hora
        totalSlots += slotsPerDay;
        availableCount += Math.floor(slotsPerDay * 0.95);
      }
      
      console.log(`      ✅ Disponibilidad creada para 6 días`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ SEED COMPLETADO EXITOSAMENTE`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Resumen:`);
  console.log(`   • Ubicaciones configuradas: ${LOCATIONS.length}`);
  console.log(`   • Especialistas totales: ${Object.values(SPECIALISTS_BY_LOCATION).flat().length}`);
  console.log(`   • Días con disponibilidad: ${dates.length}`);
  console.log(`   • Total de slots generados: ~${totalSlots}`);
  console.log(`   • Slots disponibles: ~${availableCount} (95%)`);
  console.log(`   • Slots reservados: ~${totalSlots - availableCount} (5%)`);
  console.log(``);
  console.log(`🎉 Ahora puedes agendar citas en cualquier ubicación!`);
  console.log(``);
}

// Ejecutar
seedCompleteAvailability()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
