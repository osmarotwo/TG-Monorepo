import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SERVICES_TABLE = process.env.SERVICES_TABLE || 'Services';

/**
 * Seed Services for each Business
 * Services are business-specific, not platform-wide
 */
async function seedServices() {
  console.log('🌱 Starting SERVICES seed process...\n');

  try {
    // ============================================
    // SERVICES for Salón Aurora (BIZ001)
    // ============================================
    console.log('💇 Creating services for Salón Aurora (BIZ001)...');
    const salonAuroraServices = [
      {
        PK: 'BUSINESS#BIZ001',
        SK: 'SERVICE#SRV-001',
        serviceId: 'SRV-001',
        businessId: 'BIZ001',
        name: 'Corte de cabello',
        nameEn: 'Haircut',
        description: 'Corte de cabello profesional',
        category: 'beauty',
        defaultDuration: 30,
        basePrice: 35000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ001',
        SK: 'SERVICE#SRV-002',
        serviceId: 'SRV-002',
        businessId: 'BIZ001',
        name: 'Tinte completo',
        nameEn: 'Full hair coloring',
        description: 'Coloración de cabello completa',
        category: 'beauty',
        defaultDuration: 90,
        basePrice: 120000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ001',
        SK: 'SERVICE#SRV-003',
        serviceId: 'SRV-003',
        businessId: 'BIZ001',
        name: 'Keratina',
        nameEn: 'Keratin treatment',
        description: 'Tratamiento de keratina profesional',
        category: 'beauty',
        defaultDuration: 120,
        basePrice: 200000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ001',
        SK: 'SERVICE#SRV-004',
        serviceId: 'SRV-004',
        businessId: 'BIZ001',
        name: 'Manicure',
        nameEn: 'Manicure',
        description: 'Cuidado completo de manos y uñas',
        category: 'beauty',
        defaultDuration: 45,
        basePrice: 25000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ001',
        SK: 'SERVICE#SRV-005',
        serviceId: 'SRV-005',
        businessId: 'BIZ001',
        name: 'Pedicure',
        nameEn: 'Pedicure',
        description: 'Cuidado completo de pies y uñas',
        category: 'beauty',
        defaultDuration: 60,
        basePrice: 30000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ001',
        SK: 'SERVICE#SRV-006',
        serviceId: 'SRV-006',
        businessId: 'BIZ001',
        name: 'Balayage',
        nameEn: 'Balayage',
        description: 'Técnica de coloración balayage',
        category: 'beauty',
        defaultDuration: 150,
        basePrice: 180000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const service of salonAuroraServices) {
      await putItem(service);
      console.log(`  ✅ ${service.name}`);
    }
    console.log();

    // ============================================
    // SERVICES for Fitness Pro (BIZ002)
    // ============================================
    console.log('💪 Creating services for Fitness Pro (BIZ002)...');
    const fitnessProServices = [
      {
        PK: 'BUSINESS#BIZ002',
        SK: 'SERVICE#SRV-007',
        serviceId: 'SRV-007',
        businessId: 'BIZ002',
        name: 'Entrenamiento personal',
        nameEn: 'Personal training',
        description: 'Sesión de entrenamiento personalizado',
        category: 'fitness',
        defaultDuration: 60,
        basePrice: 80000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ002',
        SK: 'SERVICE#SRV-008',
        serviceId: 'SRV-008',
        businessId: 'BIZ002',
        name: 'Clase de yoga',
        nameEn: 'Yoga class',
        description: 'Clase de yoga grupal',
        category: 'fitness',
        defaultDuration: 60,
        basePrice: 35000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ002',
        SK: 'SERVICE#SRV-009',
        serviceId: 'SRV-009',
        businessId: 'BIZ002',
        name: 'Clase de spinning',
        nameEn: 'Spinning class',
        description: 'Clase de ciclismo indoor',
        category: 'fitness',
        defaultDuration: 45,
        basePrice: 30000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ002',
        SK: 'SERVICE#SRV-010',
        serviceId: 'SRV-010',
        businessId: 'BIZ002',
        name: 'Clase de CrossFit',
        nameEn: 'CrossFit class',
        description: 'Entrenamiento funcional de alta intensidad',
        category: 'fitness',
        defaultDuration: 60,
        basePrice: 40000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const service of fitnessProServices) {
      await putItem(service);
      console.log(`  ✅ ${service.name}`);
    }
    console.log();

    // ============================================
    // SERVICES for Dental Care (BIZ003)
    // ============================================
    console.log('🦷 Creating services for Dental Care (BIZ003)...');
    const dentalCareServices = [
      {
        PK: 'BUSINESS#BIZ003',
        SK: 'SERVICE#SRV-011',
        serviceId: 'SRV-011',
        businessId: 'BIZ003',
        name: 'Consulta odontológica',
        nameEn: 'Dental checkup',
        description: 'Consulta dental general',
        category: 'health',
        defaultDuration: 30,
        basePrice: 50000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ003',
        SK: 'SERVICE#SRV-012',
        serviceId: 'SRV-012',
        businessId: 'BIZ003',
        name: 'Limpieza dental',
        nameEn: 'Dental cleaning',
        description: 'Profilaxis dental profesional',
        category: 'health',
        defaultDuration: 45,
        basePrice: 80000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ003',
        SK: 'SERVICE#SRV-013',
        serviceId: 'SRV-013',
        businessId: 'BIZ003',
        name: 'Blanqueamiento dental',
        nameEn: 'Teeth whitening',
        description: 'Blanqueamiento dental profesional',
        category: 'health',
        defaultDuration: 60,
        basePrice: 300000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ003',
        SK: 'SERVICE#SRV-014',
        serviceId: 'SRV-014',
        businessId: 'BIZ003',
        name: 'Resina dental',
        nameEn: 'Dental filling',
        description: 'Restauración con resina',
        category: 'health',
        defaultDuration: 45,
        basePrice: 120000,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const service of dentalCareServices) {
      await putItem(service);
      console.log(`  ✅ ${service.name}`);
    }
    console.log();

    // ============================================
    // SERVICES for Café Aroma (BIZ004)
    // ============================================
    console.log('☕ Creating services for Café Aroma (BIZ004)...');
    const cafeAromaServices = [
      {
        PK: 'BUSINESS#BIZ004',
        SK: 'SERVICE#SRV-015',
        serviceId: 'SRV-015',
        businessId: 'BIZ004',
        name: 'Reserva mesa para 2',
        nameEn: 'Table for 2',
        description: 'Reserva de mesa para 2 personas',
        category: 'food',
        defaultDuration: 90,
        basePrice: 0,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ004',
        SK: 'SERVICE#SRV-016',
        serviceId: 'SRV-016',
        businessId: 'BIZ004',
        name: 'Reserva mesa para 4',
        nameEn: 'Table for 4',
        description: 'Reserva de mesa para 4 personas',
        category: 'food',
        defaultDuration: 90,
        basePrice: 0,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        PK: 'BUSINESS#BIZ004',
        SK: 'SERVICE#SRV-017',
        serviceId: 'SRV-017',
        businessId: 'BIZ004',
        name: 'Reserva mesa para 6+',
        nameEn: 'Table for 6+',
        description: 'Reserva de mesa para grupos grandes',
        category: 'food',
        defaultDuration: 120,
        basePrice: 0,
        currency: 'COP',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const service of cafeAromaServices) {
      await putItem(service);
      console.log(`  ✅ ${service.name}`);
    }
    console.log();

    console.log('🎉 Services seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Salón Aurora (BIZ001): ${salonAuroraServices.length} services`);
    console.log(`  - Fitness Pro (BIZ002): ${fitnessProServices.length} services`);
    console.log(`  - Dental Care (BIZ003): ${dentalCareServices.length} services`);
    console.log(`  - Café Aroma (BIZ004): ${cafeAromaServices.length} services`);
    console.log(`  - Total: ${salonAuroraServices.length + fitnessProServices.length + dentalCareServices.length + cafeAromaServices.length} services\n`);

  } catch (error) {
    console.error('❌ Error seeding services:', error);
    throw error;
  }
}

async function putItem(item: any) {
  const command = new PutCommand({
    TableName: SERVICES_TABLE,
    Item: item,
  });
  await docClient.send(command);
}

// Run seed
seedServices()
  .then(() => {
    console.log('✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
