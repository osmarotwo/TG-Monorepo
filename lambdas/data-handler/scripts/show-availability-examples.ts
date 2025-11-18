/**
 * Script para mostrar ejemplos de disponibilidad
 * Útil para debugging y verificación visual
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

async function showAvailabilityExample() {
  console.log('📋 Ejemplos de Disponibilidad\n');
  
  // Ejemplo 1: Salón Centro - Carlos Martínez - Lunes 18
  console.log('=' .repeat(70));
  console.log('📍 Ubicación: Salón de Belleza Centro');
  console.log('👤 Especialista: Carlos Martínez (SPEC-001)');
  console.log('📅 Fecha: Lunes 18 de Noviembre 2025');
  console.log('=' .repeat(70));
  
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: AVAILABILITY_TABLE,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'LOCATION#LOC-CENTRO-ZIP',
        ':sk': 'AVAILABILITY#SPEC-001#2025-11-18'
      }
    }));
    
    const item = result.Items?.[0];
    
    if (item && item.slots) {
      console.log(`\n🕐 Horarios Disponibles (primeros 10 slots):\n`);
      
      const colombiaTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };
      
      const availableSlots = item.slots.filter((s: any) => s.status === 'available');
      const bookedSlots = item.slots.filter((s: any) => s.status === 'booked');
      
      availableSlots.slice(0, 10).forEach((slot: any, i: number) => {
        console.log(`   ${i + 1}. ${colombiaTime(slot.timestamp)} - ✅ Disponible`);
      });
      
      console.log(`\n📊 Resumen del día:`);
      console.log(`   • Total de slots: ${item.slots.length}`);
      console.log(`   • Disponibles: ${availableSlots.length} (${((availableSlots.length/item.slots.length)*100).toFixed(1)}%)`);
      console.log(`   • Reservados: ${bookedSlots.length} (${((bookedSlots.length/item.slots.length)*100).toFixed(1)}%)`);
      
      if (bookedSlots.length > 0) {
        console.log(`\n📅 Ejemplo de slots reservados:`);
        bookedSlots.slice(0, 3).forEach((slot: any) => {
          console.log(`   • ${colombiaTime(slot.timestamp)} - Reservado (${slot.serviceType || 'N/A'})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  // Ejemplo 2: Resumen de especialistas
  console.log('\n\n' + '='.repeat(70));
  console.log('👥 Resumen de Especialistas por Ubicación');
  console.log('='.repeat(70));
  
  const locations = [
    { id: 'LOC-CENTRO-ZIP', name: 'Salón Centro' },
    { id: 'LOC-SUR-ZIP', name: 'Sede Sur' },
    { id: 'LOC-NORTE-ZIP', name: 'Sede Norte' }
  ];
  
  for (const loc of locations) {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: AVAILABILITY_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `LOCATION#${loc.id}`,
          ':sk': 'SCHEDULE#'
        }
      }));
      
      console.log(`\n📍 ${loc.name}:`);
      result.Items?.forEach((item: any) => {
        console.log(`   👤 ${item.specialistName}`);
        console.log(`      Servicios: ${item.services?.join(', ') || 'N/A'}`);
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  // Ejemplo 3: Disponibilidad por fecha
  console.log('\n\n' + '='.repeat(70));
  console.log('📅 Disponibilidad por Fecha (Salón Centro)');
  console.log('='.repeat(70));
  
  const dates = ['2025-11-18', '2025-11-19', '2025-11-20'];
  
  for (const date of dates) {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: AVAILABILITY_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': 'LOCATION#LOC-CENTRO-ZIP',
          ':sk': `AVAILABILITY#SPEC-001#${date}`
        }
      }));
      
      const item = result.Items?.[0];
      if (item?.slots) {
        const available = item.slots.filter((s: any) => s.status === 'available').length;
        const dayName = new Date(date).toLocaleDateString('es', { weekday: 'long' });
        console.log(`   ${dayName} ${date}: ${available}/${item.slots.length} slots disponibles`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  console.log('\n✅ Ejemplos completados\n');
}

showAvailabilityExample()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
