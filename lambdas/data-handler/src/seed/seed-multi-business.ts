import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Table names
const BUSINESSES_TABLE = process.env.BUSINESSES_TABLE || 'Businesses';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'Locations';

// Test user
const TEST_USER_ID = 'test-user-camila';

/**
 * Multi-Business Seed Data
 * Includes:
 * - Salón Aurora (5 sedes - beauty)
 * - Fitness Pro (3 sedes - fitness)
 * - Dental Care (1 sede - health)
 * - Café Aroma (2 sedes - food)
 */
async function seedMultiBusinessData() {
  console.log('🌱 Starting MULTI-BUSINESS seed process...\n');

  try {
    // ============================================
    // BUSINESS 1: Salón Aurora (5 locations)
    // ============================================
    console.log('📊 Creating Business 1: Salón Aurora (Beauty)');
    const business1 = {
      PK: 'BUSINESS#BIZ001',
      SK: 'METADATA',
      GSI1PK: `OWNER#${TEST_USER_ID}`,
      GSI1SK: 'BUSINESS#BIZ001',
      businessId: 'BIZ001',
      name: 'Salón Aurora',
      industry: 'beauty',
      ownerId: TEST_USER_ID,
      logoUrl: 'https://placehold.co/200x200/13a4ec/white?text=Aurora',
      description: 'Cadena de salones de belleza en Bogotá',
      totalLocations: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putItem(BUSINESSES_TABLE, business1);
    console.log('✅ Salón Aurora created\n');

    // Locations for Salón Aurora
    console.log('📍 Creating 5 locations for Salón Aurora...');
    const salonLocations = [
      {
        locationId: 'LOC001',
        businessId: 'BIZ001',
        name: 'Salón Aurora - Chapinero',
        address: 'Calle 63 #10-20',
        city: 'Bogotá',
        latitude: 4.653,
        longitude: -74.057,
        phone: '+57 1 3001234',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Chapinero',
      },
      {
        locationId: 'LOC002',
        businessId: 'BIZ001',
        name: 'Salón Aurora - Chía',
        address: 'Cra 9 #5-50',
        city: 'Chía',
        latitude: 4.862,
        longitude: -74.055,
        phone: '+57 1 3001235',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Chia',
      },
      {
        locationId: 'LOC003',
        businessId: 'BIZ001',
        name: 'Salón Aurora - Usaquén',
        address: 'Calle 119 #6-25',
        city: 'Bogotá',
        latitude: 4.701,
        longitude: -74.033,
        phone: '+57 1 3001236',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Usaquen',
      },
      {
        locationId: 'LOC004',
        businessId: 'BIZ001',
        name: 'Salón Aurora - Suba',
        address: 'Calle 145 #91-10',
        city: 'Bogotá',
        latitude: 4.740,
        longitude: -74.091,
        phone: '+57 1 3001237',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Suba',
      },
      {
        locationId: 'LOC005',
        businessId: 'BIZ001',
        name: 'Salón Aurora - Kennedy',
        address: 'Cra 78K #38A-03',
        city: 'Bogotá',
        latitude: 4.635,
        longitude: -74.155,
        phone: '+57 1 3001238',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Kennedy',
      },
    ];

    for (const loc of salonLocations) {
      await createLocation(loc);
      console.log(`  ✅ ${loc.name}`);
    }
    console.log();

    // ============================================
    // BUSINESS 2: Fitness Pro (3 locations)
    // ============================================
    console.log('📊 Creating Business 2: Fitness Pro (Fitness)');
    const business2 = {
      PK: 'BUSINESS#BIZ002',
      SK: 'METADATA',
      GSI1PK: `OWNER#${TEST_USER_ID}`,
      GSI1SK: 'BUSINESS#BIZ002',
      businessId: 'BIZ002',
      name: 'Fitness Pro',
      industry: 'fitness',
      ownerId: TEST_USER_ID,
      logoUrl: 'https://placehold.co/200x200/f97316/white?text=FitPro',
      description: 'Gimnasios boutique con entrenamiento personalizado',
      totalLocations: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putItem(BUSINESSES_TABLE, business2);
    console.log('✅ Fitness Pro created\n');

    // Locations for Fitness Pro
    console.log('📍 Creating 3 locations for Fitness Pro...');
    const fitnessLocations = [
      {
        locationId: 'LOC006',
        businessId: 'BIZ002',
        name: 'Fitness Pro - Zona Rosa',
        address: 'Calle 82 #12-35',
        city: 'Bogotá',
        latitude: 4.670,
        longitude: -74.053,
        phone: '+57 1 3002001',
        imageUrl: 'https://placehold.co/400x300/f97316/white?text=Zona+Rosa',
      },
      {
        locationId: 'LOC007',
        businessId: 'BIZ002',
        name: 'Fitness Pro - Santa Barbara',
        address: 'Cra 7 #115-60',
        city: 'Bogotá',
        latitude: 4.685,
        longitude: -74.040,
        phone: '+57 1 3002002',
        imageUrl: 'https://placehold.co/400x300/f97316/white?text=Santa+Barbara',
      },
      {
        locationId: 'LOC008',
        businessId: 'BIZ002',
        name: 'Fitness Pro - Cedritos',
        address: 'Calle 147 #7-20',
        city: 'Bogotá',
        latitude: 4.732,
        longitude: -74.038,
        phone: '+57 1 3002003',
        imageUrl: 'https://placehold.co/400x300/f97316/white?text=Cedritos',
      },
    ];

    for (const loc of fitnessLocations) {
      await createLocation(loc);
      console.log(`  ✅ ${loc.name}`);
    }
    console.log();

    // ============================================
    // BUSINESS 3: Dental Care (1 location)
    // ============================================
    console.log('📊 Creating Business 3: Dental Care (Health)');
    const business3 = {
      PK: 'BUSINESS#BIZ003',
      SK: 'METADATA',
      GSI1PK: `OWNER#${TEST_USER_ID}`,
      GSI1SK: 'BUSINESS#BIZ003',
      businessId: 'BIZ003',
      name: 'Dental Care',
      industry: 'health',
      ownerId: TEST_USER_ID,
      logoUrl: 'https://placehold.co/200x200/10b981/white?text=Dental',
      description: 'Clínica odontológica especializada',
      totalLocations: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putItem(BUSINESSES_TABLE, business3);
    console.log('✅ Dental Care created\n');

    // Location for Dental Care
    console.log('📍 Creating 1 location for Dental Care...');
    const dentalLocation = {
      locationId: 'LOC009',
      businessId: 'BIZ003',
      name: 'Dental Care - Clínica Principal',
      address: 'Calle 100 #15-20',
      city: 'Bogotá',
      latitude: 4.682,
      longitude: -74.048,
      phone: '+57 1 3003001',
      imageUrl: 'https://placehold.co/400x300/10b981/white?text=Dental+Care',
    };
    await createLocation(dentalLocation);
    console.log(`  ✅ ${dentalLocation.name}`);
    console.log();

    // ============================================
    // BUSINESS 4: Café Aroma (2 locations)
    // ============================================
    console.log('📊 Creating Business 4: Café Aroma (Food)');
    const business4 = {
      PK: 'BUSINESS#BIZ004',
      SK: 'METADATA',
      GSI1PK: `OWNER#${TEST_USER_ID}`,
      GSI1SK: 'BUSINESS#BIZ004',
      businessId: 'BIZ004',
      name: 'Café Aroma',
      industry: 'food',
      ownerId: TEST_USER_ID,
      logoUrl: 'https://placehold.co/200x200/eab308/white?text=Cafe',
      description: 'Cafetería especializada en café colombiano',
      totalLocations: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putItem(BUSINESSES_TABLE, business4);
    console.log('✅ Café Aroma created\n');

    // Locations for Café Aroma
    console.log('📍 Creating 2 locations for Café Aroma...');
    const cafeLocations = [
      {
        locationId: 'LOC010',
        businessId: 'BIZ004',
        name: 'Café Aroma - La Candelaria',
        address: 'Carrera 7 #12-48',
        city: 'Bogotá',
        latitude: 4.598,
        longitude: -74.073,
        phone: '+57 1 3004001',
        imageUrl: 'https://placehold.co/400x300/eab308/white?text=Candelaria',
      },
      {
        locationId: 'LOC011',
        businessId: 'BIZ004',
        name: 'Café Aroma - Parque 93',
        address: 'Calle 93B #13-32',
        city: 'Bogotá',
        latitude: 4.676,
        longitude: -74.046,
        phone: '+57 1 3004002',
        imageUrl: 'https://placehold.co/400x300/eab308/white?text=Parque+93',
      },
    ];

    for (const loc of cafeLocations) {
      await createLocation(loc);
      console.log(`  ✅ ${loc.name}`);
    }
    console.log();

    console.log('🎉 Multi-business seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 4 Businesses:');
    console.log('    • Salón Aurora (Beauty) - 5 locations');
    console.log('    • Fitness Pro (Fitness) - 3 locations');
    console.log('    • Dental Care (Health) - 1 location');
    console.log('    • Café Aroma (Food) - 2 locations');
    console.log('  - Total: 11 Locations');
    console.log(`\n🔑 Test User ID: ${TEST_USER_ID}`);
  } catch (error) {
    console.error('❌ Error during seed process:', error);
    throw error;
  }
}

async function createLocation(loc: any) {
  const locationItem = {
    PK: `LOCATION#${loc.locationId}`,
    SK: 'METADATA',
    GSI1PK: `BUSINESS#${loc.businessId}`,
    GSI1SK: `LOCATION#${loc.locationId}`,
    GSI2PK: `GEO#${loc.city}`,
    GSI2SK: `LOCATION#${loc.locationId}`,
    ...loc,
    status: 'active',
    operatingHours: {
      monday: '9:00-19:00',
      tuesday: '9:00-19:00',
      wednesday: '9:00-19:00',
      thursday: '9:00-19:00',
      friday: '9:00-19:00',
      saturday: '10:00-18:00',
      sunday: 'closed',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await putItem(LOCATIONS_TABLE, locationItem);
}

async function putItem(tableName: string, item: Record<string, any>) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  await docClient.send(command);
}

// Run seed
seedMultiBusinessData()
  .then(() => {
    console.log('\n✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
