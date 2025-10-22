/**
 * Script para crear/actualizar LOCATIONS extendidas en toda Cundinamarca
 * 
 * Incluye las 6 originales de Zipaquirá + 2 nuevas locations distantes
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const LOCATIONS_TABLE = 'Locations';

// 8 Locations dispersas por Cundinamarca
const LOCATIONS = [
  // ORIGINALES DE ZIPAQUIRÁ
  {
    locationId: 'LOC-CENTRO-ZIP',
    businessId: 'BIZ-SALON-BELLEZA',
    name: 'Salón de Belleza Centro',
    address: 'Calle 3 #3-30, Centro, Zipaquirá',
    city: 'Zipaquirá',
    latitude: 5.0214,
    longitude: -74.0637,
    phone: '+57 1 851-2345',
    services: ['Corte', 'Peinado', 'Color', 'Tratamientos'],
  },
  {
    locationId: 'LOC-TABIO',
    businessId: 'BIZ-SALON-BELLEZA',
    name: 'Salón de Belleza Tabio',
    address: 'Calle 6 #4-20, Tabio',
    city: 'Tabio',
    latitude: 4.9197,
    longitude: -74.0897,
    phone: '+57 1 845-6789',
    services: ['Keratina', 'Tratamientos', 'Color'],
  },
  
  // SPA RELAX
  {
    locationId: 'LOC-CHIA',
    businessId: 'BIZ-SPA-RELAX',
    name: 'Spa Relax Chía',
    address: 'Av. Pradilla #10-20, Chía',
    city: 'Chía',
    latitude: 4.8614,
    longitude: -74.0581,
    phone: '+57 1 863-4567',
    services: ['Masajes', 'Faciales', 'Spa'],
  },
  {
    locationId: 'LOC-SOPO',
    businessId: 'BIZ-SPA-RELAX',
    name: 'Spa Relax Sopó',
    address: 'Av. Central #15-30, Sopó',
    city: 'Sopó',
    latitude: 4.9087,
    longitude: -73.9437,
    phone: '+57 1 857-8901',
    services: ['Masajes', 'Pedicure', 'Spa'],
  },
  
  // PELUQUERÍA MODERNA
  {
    locationId: 'LOC-CAJICA',
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    name: 'Peluquería Moderna Cajicá',
    address: 'Calle 1 #5-30, Cajicá',
    city: 'Cajicá',
    latitude: 4.9187,
    longitude: -74.0288,
    phone: '+57 1 878-3456',
    services: ['Corte', 'Keratina', 'Tratamientos', 'Facial'],
  },
  
  // ESTÉTICA BELLA
  {
    locationId: 'LOC-TOCANCIPA',
    businessId: 'BIZ-ESTETICA-BELLA',
    name: 'Estética Bella Tocancipá',
    address: 'Cra 7 #12-45, Tocancipá',
    city: 'Tocancipá',
    latitude: 4.9645,
    longitude: -73.9087,
    phone: '+57 1 876-5432',
    services: ['Manicure', 'Pedicure', 'Uñas'],
  },
  
  // BARBERÍA CLÁSICA
  {
    locationId: 'LOC-COGUA',
    businessId: 'BIZ-BARBERIA-CLASICA',
    name: 'Barbería Clásica Cogua',
    address: 'Calle Principal #8-15, Cogua',
    city: 'Cogua',
    latitude: 5.0594,
    longitude: -73.9773,
    phone: '+57 1 854-7890',
    services: ['Corte', 'Barba', 'Afeitado'],
  },
  
  // SALÓN ELITE
  {
    locationId: 'LOC-NEMOCON',
    businessId: 'BIZ-SALON-ELITE',
    name: 'Salón Elite Nemocón',
    address: 'Plaza Central, Nemocón',
    city: 'Nemocón',
    latitude: 5.0525,
    longitude: -73.8897,
    phone: '+57 1 855-1234',
    services: ['Balayage', 'Color', 'Tratamientos premium'],
  },
];

async function createLocations() {
  console.log('🏢 Creando/actualizando locations en DynamoDB...\n');

  for (const location of LOCATIONS) {
    const item = {
      // Primary Key
      PK: `BUSINESS#${location.businessId}`,
      SK: `LOCATION#${location.locationId}`,
      
      // GSI1 para búsqueda por locationId
      GSI1PK: `LOCATION#${location.locationId}`,
      GSI1SK: 'METADATA',
      
      // Attributes
      locationId: location.locationId,
      businessId: location.businessId,
      name: location.name,
      address: location.address,
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: location.phone,
      services: location.services,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: LOCATIONS_TABLE,
        Item: item,
      })
    );

    console.log(`✅ ${location.name} (${location.city})`);
    console.log(`   📍 Lat: ${location.latitude}, Lng: ${location.longitude}`);
    console.log(`   🏢 Business: ${location.businessId}`);
    console.log('');
  }

  console.log(`\n✨ ${LOCATIONS.length} locations creadas/actualizadas exitosamente!`);
  console.log('\n🎯 Ahora las citas podrán cargar correctamente en el dashboard.');
}

async function main() {
  try {
    console.log('🚀 Seed de Locations Extendidas por Cundinamarca\n');
    console.log('═'.repeat(70));
    
    await createLocations();
    
    console.log('═'.repeat(70));
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
