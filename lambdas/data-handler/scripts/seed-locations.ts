/**
 * Seed script para crear las ubicaciones (Locations) en DynamoDB
 * Estas ubicaciones son necesarias para que el dashboard pueda cargar
 * los detalles completos de cada cita
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const LOCATIONS_TABLE = 'Locations';

// Sedes de Zipaquirá
const LOCATIONS = [
  {
    locationId: 'LOC-CENTRO-ZIP',
    businessId: 'BIZ-SALON-BELLEZA',
    businessName: 'Salón Belleza Total',
    name: 'Sede Centro',
    address: 'Cra 7 #3-45, Centro, Zipaquirá',
    city: 'Zipaquirá',
    state: 'Cundinamarca',
    country: 'Colombia',
    zipCode: '250251',
    phone: '+57 315 123 4567',
    email: 'centro@salonbelleza.com',
    latitude: 5.0214,
    longitude: -73.9919,
    serviceTypes: ['Corte de cabello', 'Manicure', 'Pedicure', 'Tinte'],
    amenities: ['WiFi', 'Parking', 'Air Conditioning'],
    status: 'active'
  },
  {
    locationId: 'LOC-NORTE-ZIP',
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    businessName: 'Peluquería Moderna',
    name: 'Sede Norte',
    address: 'Calle 10 #8-32, Barrio San Juanito, Zipaquirá',
    city: 'Zipaquirá',
    state: 'Cundinamarca',
    country: 'Colombia',
    zipCode: '250251',
    phone: '+57 315 234 5678',
    email: 'norte@peluqueriamoderna.com',
    latitude: 5.0345,
    longitude: -73.9850,
    serviceTypes: ['Keratina', 'Tinte', 'Corte de cabello', 'Balayage'],
    amenities: ['WiFi', 'Coffee', 'Magazine'],
    status: 'active'
  },
  {
    locationId: 'LOC-SUR-ZIP',
    businessId: 'BIZ-SPA-RELAX',
    businessName: 'Spa Relax',
    name: 'Sede Sur',
    address: 'Carrera 5 #1-80, Barrio La Fraguita, Zipaquirá',
    city: 'Zipaquirá',
    state: 'Cundinamarca',
    country: 'Colombia',
    zipCode: '250251',
    phone: '+57 315 345 6789',
    email: 'sur@sparelax.com',
    latitude: 5.0100,
    longitude: -73.9980,
    serviceTypes: ['Masaje', 'Facial', 'Manicure', 'Pedicure'],
    amenities: ['Sauna', 'Jacuzzi', 'Relaxation Room'],
    status: 'active'
  },
  {
    locationId: 'LOC-ESTE-ZIP',
    businessId: 'BIZ-BARBERIA-CLASICA',
    businessName: 'Barbería Clásica',
    name: 'Sede Este',
    address: 'Calle 4 #12-15, Barrio La Paz, Zipaquirá',
    city: 'Zipaquirá',
    state: 'Cundinamarca',
    country: 'Colombia',
    zipCode: '250251',
    phone: '+57 315 456 7890',
    email: 'este@barberiaclasica.com',
    latitude: 5.0200,
    longitude: -73.9800,
    serviceTypes: ['Corte de cabello', 'Barba', 'Afeitado'],
    amenities: ['WiFi', 'TV', 'Beer'],
    status: 'active'
  },
  {
    locationId: 'LOC-OESTE-ZIP',
    businessId: 'BIZ-ESTETICA-BELLA',
    businessName: 'Estética Bella',
    name: 'Sede Oeste',
    address: 'Carrera 3 #5-20, Barrio San Carlos, Zipaquirá',
    city: 'Zipaquirá',
    state: 'Cundinamarca',
    country: 'Colombia',
    zipCode: '250251',
    phone: '+57 315 567 8901',
    email: 'oeste@esteticabella.com',
    latitude: 5.0250,
    longitude: -74.0050,
    serviceTypes: ['Depilación', 'Manicure', 'Pedicure', 'Facial'],
    amenities: ['WiFi', 'Parking', 'Waiting Area'],
    status: 'active'
  },
  {
    locationId: 'LOC-CATEDRAL-ZIP',
    businessId: 'BIZ-SALON-ELITE',
    businessName: 'Salón Elite',
    name: 'Sede Catedral',
    address: 'Calle 6 #6-50, Cerca Catedral, Zipaquirá',
    city: 'Zipaquirá',
    state: 'Cundinamarca',
    country: 'Colombia',
    zipCode: '250251',
    phone: '+57 315 678 9012',
    email: 'catedral@salonelite.com',
    latitude: 5.0190,
    longitude: -73.9935,
    serviceTypes: ['Keratina', 'Balayage', 'Corte de cabello', 'Tinte'],
    amenities: ['WiFi', 'Parking', 'VIP Room'],
    status: 'active'
  }
];

async function createLocations() {
  console.log('═'.repeat(70));
  console.log('🏢 SEED: Creando Ubicaciones (Locations)');
  console.log('═'.repeat(70));
  console.log(`\n📍 Total de ubicaciones a crear: ${LOCATIONS.length}\n`);

  for (const location of LOCATIONS) {
    const now = new Date().toISOString();

    const locationData = {
      PK: `BUSINESS#${location.businessId}`,
      SK: `LOCATION#${location.locationId}`,
      locationId: location.locationId,
      businessId: location.businessId,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country,
      zipCode: location.zipCode,
      phone: location.phone,
      email: location.email,
      latitude: location.latitude,
      longitude: location.longitude,
      serviceTypes: location.serviceTypes,
      amenities: location.amenities,
      status: location.status,
      rating: 4.5,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,

      // GSI1: Búsqueda por locationId
      GSI1PK: `LOCATION#${location.locationId}`,
      GSI1SK: 'METADATA',

      // GSI2: Búsqueda por ciudad
      GSI2PK: `CITY#${location.city}`,
      GSI2SK: `BUSINESS#${location.businessId}#${location.locationId}`
    };

    await docClient.send(new PutCommand({
      TableName: LOCATIONS_TABLE,
      Item: locationData
    }));

    console.log(`✅ ${location.name} - ${location.businessName}`);
    console.log(`   📍 ${location.address}`);
    console.log(`   🗺️  (${location.latitude}, ${location.longitude})\n`);
  }

  console.log('═'.repeat(70));
  console.log(`✅ ${LOCATIONS.length} ubicaciones creadas exitosamente`);
  console.log('═'.repeat(70));
  console.log('\n🎯 Próximos pasos:');
  console.log('   1. Refrescar localhost:3000/dashboard (Cmd+Shift+R)');
  console.log('   2. ✅ Las citas ahora deberían cargar correctamente');
  console.log('   3. ✅ El mapa y tarjetas de rutas deberían aparecer');
  console.log('   4. 🚀 Haz clic en "Optimizar Ruta"\n');
}

createLocations().catch(console.error);
