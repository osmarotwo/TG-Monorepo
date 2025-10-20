import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Table names (ajustar según CDK outputs)
const BUSINESSES_TABLE = process.env.BUSINESSES_TABLE || 'Businesses';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'Locations';
const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'Appointments';
const KPIS_TABLE = process.env.KPIS_TABLE || 'KPIs';

// ID del usuario (ajustar con un userId real de tu sistema)
const TEST_USER_ID = 'test-user-camila';

/**
 * Seed data based on Salón Aurora (Camila's business)
 */
async function seedData() {
  console.log('🌱 Starting seed process for Clyok Dashboard...\n');

  try {
    // 1. Create Business: Salón Aurora
    console.log('📊 Creating business: Salón Aurora');
    const business = {
      PK: 'BUSINESS#BIZ001',
      SK: 'METADATA',
      GSI1PK: `OWNER#${TEST_USER_ID}`,
      GSI1SK: 'BUSINESS#BIZ001',
      businessId: 'BIZ001',
      name: 'Salón Aurora',
      industry: 'beauty',
      ownerId: TEST_USER_ID,
      logoUrl: 'https://placehold.co/200x200/13a4ec/white?text=Aurora',
      description: 'Cadena de salones de belleza en Bogotá y Chía',
      totalLocations: 5,
      settings: {
        appointmentDuration: 60,
        workingHours: '9:00-19:00',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putItem(BUSINESSES_TABLE, business);
    console.log('✅ Business created\n');

    // 2. Create Locations (5 sedes)
    console.log('📍 Creating 5 locations...');
    const locations = [
      {
        locationId: 'LOC001',
        name: 'Salón Aurora - Sede Chapinero',
        address: 'Calle 63 #10-20',
        city: 'Bogotá',
        latitude: 4.653,
        longitude: -74.057,
        phone: '+57 1 3001234',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Chapinero',
        resources: [
          { id: 'CAB001', name: 'Cabina 1', type: 'cabin' },
          { id: 'CAB002', name: 'Cabina 2', type: 'cabin' },
          { id: 'CAB003', name: 'Cabina 3', type: 'cabin' },
        ],
        specialists: [
          { id: 'SP001', name: 'Emily Rodríguez', specialties: ['Haircut', 'Color', 'Styling'] },
          { id: 'SP002', name: 'Laura Gómez', specialties: ['Manicure', 'Pedicure', 'Nail Art'] },
        ],
      },
      {
        locationId: 'LOC002',
        name: 'Salón Aurora - Sede Chía',
        address: 'Cra 9 #5-50',
        city: 'Chía',
        latitude: 4.862,
        longitude: -74.055,
        phone: '+57 1 3001235',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Chia',
        resources: [
          { id: 'CAB004', name: 'Cabina 1', type: 'cabin' },
          { id: 'CAB005', name: 'Cabina 2', type: 'cabin' },
        ],
        specialists: [
          { id: 'SP003', name: 'Sofía Martínez', specialties: ['Haircut', 'Keratin Treatment'] },
          { id: 'SP004', name: 'Andrea López', specialties: ['Color', 'Highlights'] },
        ],
      },
      {
        locationId: 'LOC003',
        name: 'Salón Aurora - Sede Usaquén',
        address: 'Calle 119 #6-25',
        city: 'Bogotá',
        latitude: 4.701,
        longitude: -74.033,
        phone: '+57 1 3001236',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Usaquen',
        resources: [
          { id: 'CAB006', name: 'Cabina 1', type: 'cabin' },
          { id: 'CAB007', name: 'Cabina 2', type: 'cabin' },
          { id: 'CAB008', name: 'Cabina 3', type: 'cabin' },
        ],
        specialists: [
          { id: 'SP005', name: 'Carolina Pérez', specialties: ['Haircut', 'Styling', 'Makeup'] },
        ],
      },
      {
        locationId: 'LOC004',
        name: 'Salón Aurora - Sede Suba',
        address: 'Calle 145 #91-10',
        city: 'Bogotá',
        latitude: 4.740,
        longitude: -74.091,
        phone: '+57 1 3001237',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Suba',
        resources: [
          { id: 'CAB009', name: 'Cabina 1', type: 'cabin' },
          { id: 'CAB010', name: 'Cabina 2', type: 'cabin' },
        ],
        specialists: [
          { id: 'SP006', name: 'Diana Torres', specialties: ['Manicure', 'Pedicure'] },
        ],
      },
      {
        locationId: 'LOC005',
        name: 'Salón Aurora - Sede Kennedy',
        address: 'Cra 78K #38A-03',
        city: 'Bogotá',
        latitude: 4.635,
        longitude: -74.155,
        phone: '+57 1 3001238',
        imageUrl: 'https://placehold.co/400x300/13a4ec/white?text=Kennedy',
        resources: [
          { id: 'CAB011', name: 'Cabina 1', type: 'cabin' },
          { id: 'CAB012', name: 'Cabina 2', type: 'cabin' },
        ],
        specialists: [
          { id: 'SP007', name: 'Valentina Castro', specialties: ['Haircut', 'Color'] },
        ],
      },
    ];

    for (const loc of locations) {
      const locationItem = {
        PK: `LOCATION#${loc.locationId}`,
        SK: 'METADATA',
        GSI1PK: 'BUSINESS#BIZ001',
        GSI1SK: `LOCATION#${loc.locationId}`,
        GSI2PK: `GEO#${loc.city}`,
        GSI2SK: `LOCATION#${loc.locationId}`,
        ...loc,
        businessId: 'BIZ001',
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
      console.log(`  ✅ ${loc.name}`);
    }
    console.log('✅ All locations created\n');

    // 3. Create Appointments (10 citas)
    console.log('📅 Creating 10 appointments...');
    const appointments = [
      {
        appointmentId: 'APT001',
        locationId: 'LOC001',
        customerId: 'CUST001',
        customerName: 'María González',
        serviceType: 'Corte con tratamiento',
        specialistName: 'Emily Rodríguez',
        specialistId: 'SP001',
        startTime: '2025-10-17T14:00:00Z',
        endTime: '2025-10-17T15:00:00Z',
        status: 'confirmed',
        resourceId: 'CAB001',
        notes: 'Cliente prefiere corte tipo bob',
      },
      {
        appointmentId: 'APT002',
        locationId: 'LOC002',
        customerId: 'CUST002',
        customerName: 'Ana Rodríguez',
        serviceType: 'Color & Highlights',
        specialistName: 'Andrea López',
        specialistId: 'SP004',
        startTime: '2025-10-17T16:00:00Z',
        endTime: '2025-10-17T18:00:00Z',
        status: 'confirmed',
        resourceId: 'CAB005',
        notes: 'Primer color del año',
      },
      {
        appointmentId: 'APT003',
        locationId: 'LOC001',
        customerId: 'CUST003',
        customerName: 'Carolina Méndez',
        serviceType: 'Manicure Spa',
        specialistName: 'Laura Gómez',
        specialistId: 'SP002',
        startTime: '2025-10-18T10:00:00Z',
        endTime: '2025-10-18T11:00:00Z',
        status: 'confirmed',
        resourceId: 'CAB002',
      },
      {
        appointmentId: 'APT004',
        locationId: 'LOC003',
        customerId: 'CUST004',
        customerName: 'Juliana Pérez',
        serviceType: 'Corte & Peinado',
        specialistName: 'Carolina Pérez',
        specialistId: 'SP005',
        startTime: '2025-10-19T15:00:00Z',
        endTime: '2025-10-19T17:00:00Z',
        status: 'pending',
        resourceId: 'CAB006',
        notes: 'Evento especial el sábado',
      },
      {
        appointmentId: 'APT005',
        locationId: 'LOC004',
        customerId: 'CUST005',
        customerName: 'Daniela Ruiz',
        serviceType: 'Pedicure & Decoración',
        specialistName: 'Diana Torres',
        specialistId: 'SP006',
        startTime: '2025-10-20T11:00:00Z',
        endTime: '2025-10-20T12:30:00Z',
        status: 'confirmed',
        resourceId: 'CAB009',
      },
      {
        appointmentId: 'APT006',
        locationId: 'LOC005',
        customerId: 'CUST006',
        customerName: 'Mónica Ramírez',
        serviceType: 'Tratamiento de Keratina',
        specialistName: 'Valentina Castro',
        specialistId: 'SP007',
        startTime: '2025-10-21T09:00:00Z',
        endTime: '2025-10-21T12:00:00Z',
        status: 'confirmed',
        resourceId: 'CAB011',
      },
      {
        appointmentId: 'APT007',
        locationId: 'LOC001',
        customerId: 'CUST007',
        customerName: 'Patricia Silva',
        serviceType: 'Corte Infantil',
        specialistName: 'Emily Rodríguez',
        specialistId: 'SP001',
        startTime: '2025-10-15T16:00:00Z',
        endTime: '2025-10-15T16:30:00Z',
        status: 'completed',
        resourceId: 'CAB001',
      },
      {
        appointmentId: 'APT008',
        locationId: 'LOC002',
        customerId: 'CUST008',
        customerName: 'Luisa Fernández',
        serviceType: 'Alisado Brasileño',
        specialistName: 'Sofía Martínez',
        specialistId: 'SP003',
        startTime: '2025-10-14T10:00:00Z',
        endTime: '2025-10-14T13:00:00Z',
        status: 'completed',
        resourceId: 'CAB004',
      },
      {
        appointmentId: 'APT009',
        locationId: 'LOC003',
        customerId: 'CUST009',
        customerName: 'Sandra Morales',
        serviceType: 'Maquillaje Profesional',
        specialistName: 'Carolina Pérez',
        specialistId: 'SP005',
        startTime: '2025-10-13T14:00:00Z',
        endTime: '2025-10-13T15:30:00Z',
        status: 'no-show',
        resourceId: 'CAB007',
        notes: 'Cliente no se presentó, segunda vez este mes',
      },
      {
        appointmentId: 'APT010',
        locationId: 'LOC001',
        customerId: 'CUST010',
        customerName: 'Andrea Castro',
        serviceType: 'Corte & Color',
        specialistName: 'Emily Rodríguez',
        specialistId: 'SP001',
        startTime: '2025-10-12T11:00:00Z',
        endTime: '2025-10-12T13:00:00Z',
        status: 'cancelled',
        resourceId: 'CAB003',
        notes: 'Cancelada por cliente con 24h de anticipación',
      },
    ];

    for (const apt of appointments) {
      const appointmentItem = {
        PK: `APPOINTMENT#${apt.appointmentId}`,
        SK: 'METADATA',
        GSI1PK: `USER#${TEST_USER_ID}`,
        GSI1SK: `APPOINTMENT#${apt.startTime}`,
        GSI2PK: `LOCATION#${apt.locationId}`,
        GSI2SK: `APPOINTMENT#${apt.startTime}`,
        GSI3PK: 'BUSINESS#BIZ001',
        GSI3SK: `STATUS#${apt.status}#TIME#${apt.startTime}`,
        ...apt,
        businessId: 'BIZ001',
        userId: TEST_USER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(APPOINTMENTS_TABLE, appointmentItem);
      console.log(`  ✅ ${apt.appointmentId}: ${apt.customerName} - ${apt.serviceType}`);
    }
    console.log('✅ All appointments created\n');

    // 4. Create KPIs for locations
    console.log('📈 Creating KPIs for locations...');
    const period = '2025-10';
    const kpisData = [
      { locationId: 'LOC001', metricType: 'no-show-rate', value: 22, target: 12 },
      { locationId: 'LOC001', metricType: 'occupancy', value: 74, target: 85 },
      { locationId: 'LOC001', metricType: 'avg-ticket', value: 78000, target: 85000 },
      { locationId: 'LOC002', metricType: 'no-show-rate', value: 18, target: 12 },
      { locationId: 'LOC002', metricType: 'occupancy', value: 82, target: 85 },
      { locationId: 'LOC002', metricType: 'avg-ticket', value: 82000, target: 85000 },
      { locationId: 'LOC003', metricType: 'no-show-rate', value: 15, target: 12 },
      { locationId: 'LOC003', metricType: 'occupancy', value: 88, target: 85 },
      { locationId: 'LOC003', metricType: 'avg-ticket', value: 91000, target: 85000 },
      { locationId: 'LOC004', metricType: 'no-show-rate', value: 25, target: 12 },
      { locationId: 'LOC004', metricType: 'occupancy', value: 68, target: 85 },
      { locationId: 'LOC004', metricType: 'avg-ticket', value: 72000, target: 85000 },
      { locationId: 'LOC005', metricType: 'no-show-rate', value: 20, target: 12 },
      { locationId: 'LOC005', metricType: 'occupancy', value: 76, target: 85 },
      { locationId: 'LOC005', metricType: 'avg-ticket', value: 79000, target: 85000 },
    ];

    for (const kpi of kpisData) {
      const kpiItem = {
        PK: `KPI#${kpi.locationId}#${period}`,
        SK: `METRIC#${kpi.metricType}`,
        ...kpi,
        period,
        calculatedAt: new Date().toISOString(),
      };
      await putItem(KPIS_TABLE, kpiItem);
      console.log(`  ✅ ${kpi.locationId} - ${kpi.metricType}: ${kpi.value}`);
    }
    console.log('✅ All KPIs created\n');

    console.log('🎉 Seed process completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 1 Business (Salón Aurora)');
    console.log('  - 5 Locations (Chapinero, Chía, Usaquén, Suba, Kennedy)');
    console.log('  - 10 Appointments (2 upcoming, 2 completed, 1 no-show, 1 cancelled, 4 future)');
    console.log('  - 15 KPIs (3 per location)');
    console.log(`\n🔑 Test User ID: ${TEST_USER_ID}`);
    console.log('   Use this ID to query data from the frontend');
  } catch (error) {
    console.error('❌ Error during seed process:', error);
    throw error;
  }
}

async function putItem(tableName: string, item: Record<string, any>) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  await docClient.send(command);
}

// Run seed
seedData()
  .then(() => {
    console.log('\n✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
