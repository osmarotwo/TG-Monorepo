/**
 * Seed script para crear los 6 BUSINESSES en DynamoDB
 * Estos son los comercios donde Valerie (cliente) tiene sus citas
 * 
 * DISEÑO:
 * - BUSINESS (Comercio) → tiene múltiples LOCATIONS (sedes)
 * - Cada LOCATION puede tener múltiples SPECIALISTS
 * - Los clientes (como Valerie) agendan APPOINTMENTS en estas locations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const BUSINESSES_TABLE = 'Businesses';

const BUSINESSES = [
  {
    businessId: 'BIZ-SALON-BELLEZA',
    name: 'Salón Belleza Total',
    description: 'Salón de belleza integral con servicios de peluquería, manicure y tratamientos capilares',
    category: 'Salón de Belleza',
    email: 'contacto@salonbelleza.com',
    phone: '+57 315 123 4567',
    website: 'www.salonbelleza.com',
    logo: 'https://via.placeholder.com/150?text=Belleza+Total',
    businessHours: {
      monday: { open: '08:00', close: '19:00' },
      tuesday: { open: '08:00', close: '19:00' },
      wednesday: { open: '08:00', close: '19:00' },
      thursday: { open: '08:00', close: '19:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '15:00' }
    },
    services: ['Corte de cabello', 'Manicure', 'Pedicure', 'Tinte', 'Keratina'],
    rating: 4.5,
    totalReviews: 127
  },
  {
    businessId: 'BIZ-PELUQUERIA-MODERNA',
    name: 'Peluquería Moderna',
    description: 'Peluquería especializada en cortes modernos, coloración y tratamientos profesionales',
    category: 'Peluquería',
    email: 'info@peluqueriamoderna.com',
    phone: '+57 315 234 5678',
    website: 'www.peluqueriamoderna.com',
    logo: 'https://via.placeholder.com/150?text=Peluqueria+Moderna',
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '19:00' },
      saturday: { open: '10:00', close: '17:00' },
      sunday: { open: 'Cerrado', close: 'Cerrado' }
    },
    services: ['Keratina', 'Tinte', 'Corte de cabello', 'Balayage', 'Alisado'],
    rating: 4.7,
    totalReviews: 89
  },
  {
    businessId: 'BIZ-SPA-RELAX',
    name: 'Spa Relax',
    description: 'Centro de relajación y bienestar con masajes, faciales y tratamientos corporales',
    category: 'Spa',
    email: 'reservas@sparelax.com',
    phone: '+57 315 345 6789',
    website: 'www.sparelax.com',
    logo: 'https://via.placeholder.com/150?text=Spa+Relax',
    businessHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '21:00' },
      saturday: { open: '09:00', close: '21:00' },
      sunday: { open: '10:00', close: '18:00' }
    },
    services: ['Masaje', 'Facial', 'Manicure', 'Pedicure', 'Tratamiento corporal'],
    rating: 4.8,
    totalReviews: 156
  },
  {
    businessId: 'BIZ-BARBERIA-CLASICA',
    name: 'Barbería Clásica',
    description: 'Barbería tradicional especializada en cortes masculinos, barba y afeitado clásico',
    category: 'Barbería',
    email: 'citas@barberiaclasica.com',
    phone: '+57 315 456 7890',
    website: 'www.barberiaclasica.com',
    logo: 'https://via.placeholder.com/150?text=Barberia+Clasica',
    businessHours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '15:00' }
    },
    services: ['Corte de cabello', 'Barba', 'Afeitado', 'Diseño de barba'],
    rating: 4.6,
    totalReviews: 203
  },
  {
    businessId: 'BIZ-ESTETICA-BELLA',
    name: 'Estética Bella',
    description: 'Centro de estética integral con depilación, manicure y tratamientos faciales',
    category: 'Estética',
    email: 'atencion@esteticabella.com',
    phone: '+57 315 567 8901',
    website: 'www.esteticabella.com',
    logo: 'https://via.placeholder.com/150?text=Estetica+Bella',
    businessHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '19:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: 'Cerrado', close: 'Cerrado' }
    },
    services: ['Depilación', 'Manicure', 'Pedicure', 'Facial', 'Cejas'],
    rating: 4.4,
    totalReviews: 94
  },
  {
    businessId: 'BIZ-SALON-ELITE',
    name: 'Salón Elite',
    description: 'Salón de alta gama especializado en coloración premium, keratina y tratamientos exclusivos',
    category: 'Salón Premium',
    email: 'vip@salonelite.com',
    phone: '+57 315 678 9012',
    website: 'www.salonelite.com',
    logo: 'https://via.placeholder.com/150?text=Salon+Elite',
    businessHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '21:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '11:00', close: '17:00' }
    },
    services: ['Keratina', 'Balayage', 'Corte de cabello', 'Tinte', 'Tratamientos premium'],
    rating: 4.9,
    totalReviews: 178
  }
];

async function createBusinesses() {
  console.log('═'.repeat(70));
  console.log('🏢 SEED: Creando BUSINESSES (Comercios)');
  console.log('═'.repeat(70));
  console.log(`\n📊 Total de comercios a crear: ${BUSINESSES.length}\n`);

  for (const business of BUSINESSES) {
    const now = new Date().toISOString();

    const businessData = {
      PK: `BUSINESS#${business.businessId}`,
      SK: 'METADATA',
      GSI1PK: `CATEGORY#${business.category}`,
      GSI1SK: `BUSINESS#${business.businessId}`,
      businessId: business.businessId,
      name: business.name,
      description: business.description,
      category: business.category,
      contactInfo: {
        email: business.email,
        phone: business.phone,
        website: business.website
      },
      logo: business.logo,
      businessHours: business.businessHours,
      services: business.services,
      rating: business.rating,
      totalReviews: business.totalReviews,
      status: 'active',
      verified: true,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: BUSINESSES_TABLE,
      Item: businessData
    }));

    console.log(`✅ ${business.name} (${business.businessId})`);
    console.log(`   📧 ${business.email}`);
    console.log(`   📞 ${business.phone}`);
    console.log(`   ⭐ ${business.rating}/5 (${business.totalReviews} reseñas)`);
    console.log(`   🎯 Servicios: ${business.services.slice(0, 3).join(', ')}...`);
    console.log('');
  }

  console.log('═'.repeat(70));
  console.log('✅ BUSINESSES CREADOS EXITOSAMENTE');
  console.log('═'.repeat(70));
  console.log(`\n📝 Resumen:`);
  console.log(`   • ${BUSINESSES.length} comercios creados`);
  console.log(`   • Todos con status: active`);
  console.log(`   • Todos con horarios definidos`);
  console.log(`   • Listos para recibir citas de clientes\n`);
}

createBusinesses().catch(console.error);
