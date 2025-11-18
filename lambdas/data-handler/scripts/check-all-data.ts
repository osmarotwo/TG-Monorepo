import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkAllData() {
  console.log('🔍 Verificando datos en DynamoDB...\n');
  
  // Check Locations
  console.log('=' .repeat(70));
  console.log('📍 UBICACIONES (Tabla: Locations)');
  console.log('=' .repeat(70));
  
  try {
    const locationsResult = await docClient.send(new ScanCommand({
      TableName: 'Locations'
    }));
    
    console.log(`Total encontradas: ${locationsResult.Items?.length || 0}\n`);
    
    if (locationsResult.Items && locationsResult.Items.length > 0) {
      locationsResult.Items.forEach((loc, index) => {
        console.log(`${index + 1}. ${loc.name || 'Sin nombre'}`);
        console.log(`   ID: ${loc.id || loc.locationId || 'N/A'}`);
        console.log(`   Business ID: ${loc.businessId || 'N/A'}`);
        console.log(`   Dirección: ${loc.address || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron ubicaciones\n');
    }
  } catch (error: any) {
    console.error('❌ Error en Locations:', error.message);
  }
  
  // Check Businesses
  console.log('\n' + '='.repeat(70));
  console.log('🏢 NEGOCIOS (Tabla: Businesses)');
  console.log('=' .repeat(70));
  
  try {
    const businessesResult = await docClient.send(new ScanCommand({
      TableName: 'Businesses'
    }));
    
    console.log(`Total encontrados: ${businessesResult.Items?.length || 0}\n`);
    
    if (businessesResult.Items && businessesResult.Items.length > 0) {
      businessesResult.Items.forEach((biz, index) => {
        console.log(`${index + 1}. ${biz.name || 'Sin nombre'}`);
        console.log(`   ID: ${biz.id || biz.businessId || 'N/A'}`);
        console.log(`   Descripción: ${biz.description || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron negocios\n');
    }
  } catch (error: any) {
    console.error('❌ Error en Businesses:', error.message);
  }
  
  // Check Availability
  console.log('\n' + '='.repeat(70));
  console.log('📅 DISPONIBILIDAD (Tabla: Availability)');
  console.log('=' .repeat(70));
  
  try {
    const availResult = await docClient.send(new ScanCommand({
      TableName: 'Availability',
      Limit: 10
    }));
    
    console.log(`Registros de muestra: ${availResult.Items?.length || 0}\n`);
    
    if (availResult.Items && availResult.Items.length > 0) {
      const uniqueLocations = new Set(availResult.Items.map(i => i.locationId));
      console.log(`Ubicaciones con disponibilidad: ${[...uniqueLocations].join(', ')}\n`);
      
      availResult.Items.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.locationName || 'N/A'}`);
        console.log(`   Location ID: ${item.locationId || 'N/A'}`);
        console.log(`   Especialista: ${item.specialistName || 'N/A'}`);
        console.log(`   Fecha: ${item.date || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontró disponibilidad\n');
    }
  } catch (error: any) {
    console.error('❌ Error en Availability:', error.message);
  }
}

checkAllData().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
