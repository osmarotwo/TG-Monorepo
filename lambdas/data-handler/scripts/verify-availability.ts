/**
 * Script para verificar la disponibilidad generada
 * Consulta DynamoDB y muestra un resumen de la disponibilidad
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

const LOCATIONS = [
  'LOC-CENTRO-ZIP',
  'LOC-SUR-ZIP',
  'LOC-NORTE-ZIP',
  'LOC-OESTE-ZIP',
  'LOC-ESTE-ZIP'
];

async function verifyAvailability() {
  console.log('🔍 Verificando disponibilidad generada...\n');
  
  for (const locationId of LOCATIONS) {
    console.log(`📍 Ubicación: ${locationId}`);
    
    try {
      // Consultar todos los registros de esta ubicación
      const result = await docClient.send(new QueryCommand({
        TableName: AVAILABILITY_TABLE,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `LOCATION#${locationId}`
        }
      }));
      
      const items = result.Items || [];
      
      // Separar por tipo
      const businessHours = items.filter(i => i.SK === 'HOURS#BUSINESS');
      const schedules = items.filter(i => i.SK?.startsWith('SCHEDULE#'));
      const availability = items.filter(i => i.SK?.startsWith('AVAILABILITY#'));
      
      console.log(`   • Horarios de negocio: ${businessHours.length > 0 ? '✅' : '❌'}`);
      console.log(`   • Especialistas con horario: ${schedules.length}`);
      console.log(`   • Días con disponibilidad: ${availability.length}`);
      
      // Contar slots disponibles
      let totalSlots = 0;
      let availableSlots = 0;
      
      for (const avail of availability) {
        if (avail.slots) {
          totalSlots += avail.slots.length;
          availableSlots += avail.slots.filter((s: any) => s.status === 'available').length;
        }
      }
      
      console.log(`   • Total slots: ${totalSlots}`);
      console.log(`   • Disponibles: ${availableSlots} (${totalSlots > 0 ? ((availableSlots/totalSlots)*100).toFixed(1) : 0}%)`);
      
      // Mostrar algunas fechas disponibles
      if (availability.length > 0) {
        const dates = availability.slice(0, 3).map(a => a.date).join(', ');
        console.log(`   • Ejemplo de fechas: ${dates}...`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  console.log('✅ Verificación completada');
}

verifyAvailability()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
