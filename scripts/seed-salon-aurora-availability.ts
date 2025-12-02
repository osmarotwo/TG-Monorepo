import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const AVAILABILITY_TABLE = 'Availability';

// Business ID del Salón Aurora
const BUSINESS_ID = 'BIZ001';

// Locations del Salón Aurora más cercanas a Chía
const LOCATIONS = [
  { id: 'LOC002', name: 'Salón Aurora - Chía' },
  { id: 'LOC003', name: 'Salón Aurora - Usaquén' }
];



// Mapeo de nombres de servicios del frontend a IDs internos
const SERVICE_NAME_TO_SERVICES: Record<string, string[]> = {
  'Corte de cabello': ['corte-dama', 'corte-caballero'],
  'Tinte completo': ['color'],
  'Keratina': ['keratina'],
  'Manicure': ['manicure'],
  'Pedicure': ['pedicure'],
  'Balayage': ['mechas']
};

// Especialistas - cada uno puede ofrecer múltiples servicios
const SPECIALISTS = [
  { id: 'ESP001', name: 'María González', services: ['Corte de cabello', 'Balayage'] },
  { id: 'ESP002', name: 'Sofía López', services: ['Corte de cabello', 'Tinte completo'] },
  { id: 'ESP003', name: 'Camila Vargas', services: ['Corte de cabello', 'Manicure'] },
  { id: 'ESP004', name: 'Carlos Ramírez', services: ['Corte de cabello'] },
  { id: 'ESP005', name: 'Diego Torres', services: ['Corte de cabello'] },
  { id: 'ESP006', name: 'Andrés Moreno', services: ['Corte de cabello', 'Tinte completo'] },
  { id: 'ESP007', name: 'Ana Martínez', services: ['Tinte completo', 'Balayage'] },
  { id: 'ESP008', name: 'Daniela Rojas', services: ['Tinte completo', 'Keratina'] },
  { id: 'ESP009', name: 'Patricia Silva', services: ['Keratina', 'Tinte completo'] },
  { id: 'ESP010', name: 'Laura Pérez', services: ['Manicure', 'Pedicure'] },
  { id: 'ESP011', name: 'Valentina Ruiz', services: ['Manicure', 'Pedicure'] },
  { id: 'ESP012', name: 'Isabella Gómez', services: ['Manicure', 'Pedicure'] },
  { id: 'ESP013', name: 'Carolina Mendoza', services: ['Keratina', 'Balayage'] },
  { id: 'ESP014', name: 'Mariana Castro', services: ['Keratina'] },
  { id: 'ESP015', name: 'Juliana Ríos', services: ['Corte de cabello', 'Manicure'] },
  { id: 'ESP016', name: 'Andrea Salazar', services: ['Tinte completo', 'Balayage'] }
];

// Función para generar slots de disponibilidad
function generateTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const startHour = 6; // 6 AM
  const endHour = 20; // 8 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  
  return slots;
}

// Función para obtener fechas de hoy hasta el domingo
function getDateRange(): Date[] {
  const dates: Date[] = [];
  const today = new Date('2025-12-01'); // Domingo 1 de diciembre
  const endDate = new Date('2025-12-07'); // Sábado 7 de diciembre
  
  let currentDate = new Date(today);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Crear items de disponibilidad
function createAvailabilityItems() {
  const items: any[] = [];
  const dates = getDateRange();
  
  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const slots = generateTimeSlots(date);
    
    for (const location of LOCATIONS) {
      for (const specialist of SPECIALISTS) {
        // Crear un registro por especialista-ubicación-fecha
        // con todos los slots del día en el objeto availability
        const availability: Record<string, boolean> = {};
        slots.forEach(time => {
          availability[time] = true;
        });
        
        items.push({
          PK: `SPECIALIST#${specialist.id}`,
          SK: `SCHEDULE#${dateStr}#${location.id}`,
          GSI1PK: `DATE#${dateStr}#LOCATION#${location.id}`,
          GSI1SK: `SPECIALIST#${specialist.id}`,
          businessId: BUSINESS_ID,
          locationId: location.id,
          locationName: location.name,
          specialistId: specialist.id,
          specialistName: specialist.name,
          services: specialist.services, // Lista de servicios que ofrece el especialista
          date: dateStr,
          availability, // Objeto con todos los slots: { "06:00": true, "06:30": true, ... }
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }
  
  return items;
}

// Batch write con chunks de 25 items (límite de DynamoDB)
async function batchWriteItems(items: any[]) {
  const chunks: any[][] = [];
  const chunkSize = 25;
  
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  
  console.log(`📊 Total items: ${items.length}`);
  console.log(`📦 Total chunks: ${chunks.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [AVAILABILITY_TABLE]: chunk.map(item => ({
            PutRequest: { Item: item }
          }))
        }
      }));
      
      successCount += chunk.length;
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Progress: ${i + 1}/${chunks.length} chunks (${successCount} items)`);
      }
      
      // Pequeña pausa para no sobrecargar DynamoDB
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error in chunk ${i + 1}:`, error);
      errorCount += chunk.length;
    }
  }
  
  console.log(`\n✅ Success: ${successCount} items`);
  console.log(`❌ Errors: ${errorCount} items`);
}

// Main execution
async function main() {
  console.log('🚀 Starting Salón Aurora availability seed...\n');
  
  console.log('📋 Configuration:');
  console.log(`   Business: Salón Aurora (${BUSINESS_ID})`);
  console.log(`   Locations: ${LOCATIONS.length}`);
  console.log(`   Specialists: ${SPECIALISTS.length}`);
  console.log(`   Date range: 2025-12-01 to 2025-12-07`);
  console.log(`   Time slots: 6:00 AM - 8:00 PM (every 30 min)`);
  console.log('');
  
  const items = createAvailabilityItems();
  
  console.log(`📝 Generated ${items.length} availability slots\n`);
  
  const proceed = true; // Cambiar a false si quieres confirmar manualmente
  
  if (proceed) {
    await batchWriteItems(items);
    console.log('\n✅ Seed completed successfully!');
  } else {
    console.log('❌ Seed cancelled');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
