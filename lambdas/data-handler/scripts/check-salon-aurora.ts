import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkSalonAurora() {
  console.log('🔍 Verificando Salón Aurora - Chapinero (LOC001)\n');
  
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: 'Availability',
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'LOCATION#LOC001'
      }
    }));
    
    const items = result.Items || [];
    
    console.log(`📊 Registros encontrados: ${items.length}\n`);
    
    const businessHours = items.filter(i => i.SK === 'HOURS#BUSINESS');
    const schedules = items.filter(i => i.SK?.startsWith('SCHEDULE#'));
    const availability = items.filter(i => i.SK?.startsWith('AVAILABILITY#'));
    
    console.log(`✅ Horarios de negocio: ${businessHours.length > 0 ? 'SÍ' : 'NO'}`);
    console.log(`✅ Especialistas: ${schedules.length}`);
    
    schedules.forEach(s => {
      console.log(`   - ${s.specialistName}: ${s.services?.join(', ')}`);
    });
    
    console.log(`\n📅 Disponibilidad por fecha:`);
    
    // Agrupar por fecha
    const byDate = new Map();
    availability.forEach(a => {
      if (!byDate.has(a.date)) {
        byDate.set(a.date, []);
      }
      byDate.get(a.date).push(a);
    });
    
    Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, avails]) => {
        console.log(`\n   ${date}:`);
        avails.forEach((a: any) => {
          const available = a.slots?.filter((s: any) => s.status === 'available').length || 0;
          const total = a.slots?.length || 0;
          console.log(`     ${a.specialistName}: ${available}/${total} slots disponibles`);
          
          // Mostrar primeros 3 slots disponibles
          if (a.slots && a.slots.length > 0) {
            const firstAvail = a.slots
              .filter((s: any) => s.status === 'available')
              .slice(0, 3)
              .map((s: any) => {
                const date = new Date(s.timestamp);
                return date.toLocaleTimeString('es-CO', { 
                  timeZone: 'America/Bogota', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              });
            console.log(`       Ej: ${firstAvail.join(', ')}`);
          }
        });
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSalonAurora()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
