/**
 * Script para generar disponibilidad para TODAS las ubicaciones existentes
 * Fecha: 18-23 de noviembre de 2025
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = 'Availability';
const LOCATIONS_TABLE = 'Locations';

// Especialistas genéricos que rotaremos entre ubicaciones
const SPECIALISTS = [
  { id: 'SPEC-001', name: 'Carlos Martínez', services: ['Corte de Cabello', 'Peinado'] },
  { id: 'SPEC-002', name: 'Ana López', services: ['Manicure', 'Pedicure'] },
  { id: 'SPEC-003', name: 'Juan Rodríguez', services: ['Corte de Cabello', 'Tinte'] },
  { id: 'SPEC-004', name: 'María García', services: ['Tinte', 'Masaje Facial'] },
  { id: 'SPEC-005', name: 'Pedro Sánchez', services: ['Corte de Cabello', 'Peinado'] },
  { id: 'SPEC-006', name: 'Laura Torres', services: ['Manicure', 'Pedicure', 'Masaje Facial'] }
];

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
  
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotDate = new Date(date);
      slotDate.setUTCHours(hour + 5, minute, 0, 0); // Colombia = UTC-5, así que sumamos 5
      slots.push(slotDate.toISOString());
    }
  }
  
  return slots;
}

function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Desde hoy hasta el sábado (6 días)
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

async function getAllLocations() {
  const result = await docClient.send(new ScanCommand({
    TableName: LOCATIONS_TABLE
  }));
  
  return result.Items || [];
}

async function createBusinessHours(location: any) {
  const locationId = location.id || location.locationId;
  
  const doc = {
    PK: `LOCATION#${locationId}`,
    SK: 'HOURS#BUSINESS',
    locationId: locationId,
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
}

async function createSpecialistSchedule(location: any, specialist: any) {
  const locationId = location.id || location.locationId;
  
  const doc = {
    PK: `LOCATION#${locationId}`,
    SK: `SCHEDULE#${specialist.id}`,
    locationId: locationId,
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
  const locationId = location.id || location.locationId;
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = getDayOfWeek(date);
  const timeSlots = generateTimeSlots(date);
  
  const doc = {
    PK: `LOCATION#${locationId}`,
    SK: `AVAILABILITY#${specialist.id}#${dateStr}`,
    locationId: locationId,
    locationName: location.name,
    specialistId: specialist.id,
    specialistName: specialist.name,
    date: dateStr,
    dayOfWeek,
    slots: timeSlots.map(timestamp => {
      const isAvailable = Math.random() > 0.05; // 95% disponibles
      
      return {
        timestamp,
        status: isAvailable ? 'available' : 'booked',
        duration: 30,
        ...(isAvailable ? {} : { 
          bookedBy: 'DEMO-USER',
          serviceType: specialist.services[0]
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

async function seedAllLocations() {
  console.log('🌱 Generando disponibilidad para TODAS las ubicaciones...\n');
  
  const locations = await getAllLocations();
  const dates = getWeekDates();
  
  console.log(`📍 Ubicaciones encontradas: ${locations.length}`);
  console.log(`📅 Fechas: ${dates.length} días`);
  console.log(`👥 Especialistas por ubicación: 2`);
  console.log('');
  
  let processedCount = 0;
  
  for (const location of locations) {
    processedCount++;
    const locationId = location.id || location.locationId;
    console.log(`\n[${processedCount}/${locations.length}] 📍 ${location.name} (${locationId})`);
    
    try {
      // Crear horarios de negocio
      await createBusinessHours(location);
      console.log('   ✅ Horarios de negocio');
      
      // Asignar 2 especialistas aleatorios a cada ubicación
      const assignedSpecialists = [
        SPECIALISTS[processedCount % SPECIALISTS.length],
        SPECIALISTS[(processedCount + 1) % SPECIALISTS.length]
      ];
      
      for (const specialist of assignedSpecialists) {
        // Crear horario del especialista
        await createSpecialistSchedule(location, specialist);
        
        // Crear disponibilidad para cada día
        for (const date of dates) {
          await createDailyAvailability(location, specialist, date);
        }
        
        console.log(`   ✅ ${specialist.name} (${dates.length} días)`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  const totalSlots = locations.length * 2 * dates.length * 24; // ubicaciones × especialistas × días × slots
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ DISPONIBILIDAD GENERADA PARA TODAS LAS UBICACIONES`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📊 Resumen:`);
  console.log(`   • Ubicaciones: ${locations.length}`);
  console.log(`   • Especialistas totales: ${locations.length * 2}`);
  console.log(`   • Días: ${dates.length}`);
  console.log(`   • Total de slots: ~${totalSlots}`);
  console.log(`   • Disponibles: ~${Math.floor(totalSlots * 0.95)} (95%)`);
  console.log(``);
  console.log(`🎉 Ahora puedes agendar en cualquier ubicación, incluyendo:`);
  console.log(`   - Salón Aurora - Chapinero`);
  console.log(`   - Salón Aurora - Chía`);
  console.log(`   - Y todas las demás (${locations.length} ubicaciones)`);
  console.log(``);
}

seedAllLocations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
