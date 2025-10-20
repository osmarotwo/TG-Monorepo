/**
 * Seed de citas de ejemplo para el usuario de prueba
 * Este script crea citas en diferentes ubicaciones para demostrar el mapa en el dashboard
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'Appointments'
const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616' // osmarotwo@gmail.com (Valerie Sofia Martinez)

// IDs de las ubicaciones existentes del seed principal (seed-data.ts)
const LOCATIONS = [
  { id: 'LOC001', name: 'Salón Aurora - Sede Chapinero', businessId: 'BIZ001', lat: 4.653, lng: -74.057 },
  { id: 'LOC002', name: 'Salón Aurora - Sede Chía', businessId: 'BIZ001', lat: 4.862, lng: -74.055 },
  { id: 'LOC003', name: 'Salón Aurora - Sede Usaquén', businessId: 'BIZ001', lat: 4.701, lng: -74.033 },
  { id: 'LOC004', name: 'Salón Aurora - Sede Suba', businessId: 'BIZ001', lat: 4.740, lng: -74.091 },
  { id: 'LOC005', name: 'Salón Aurora - Sede Kennedy', businessId: 'BIZ001', lat: 4.635, lng: -74.155 },
]

async function createAppointment(data: any) {
  await docClient.send(
    new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: data,
    })
  )
}

async function main() {
  console.log('🌱 Starting appointments seed for user dashboard...\n')

  const now = new Date()
  const CUSTOMER_NAME = 'Valerie Sofia Martinez' // Nombre real del usuario
  
  // Crear 6 citas para MAÑANA en ubicaciones diferentes
  // Esto mostrará múltiples desplazamientos en el mapa
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1) // Mañana
  tomorrow.setHours(8, 0, 0, 0) // Empezar a las 8:00 AM
  
  const appointments = [
    // Cita 1: Chapinero (Centro) - 8:00 AM
    {
      PK: 'APPOINTMENT#APT-001',
      SK: 'APPOINTMENT#APT-001',
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${new Date(tomorrow.getTime()).toISOString()}`,
      GSI2PK: `LOCATION#${LOCATIONS[0].id}`,
      GSI2SK: `APPOINTMENT#${new Date(tomorrow.getTime()).toISOString()}`,
      appointmentId: 'APT-001',
      businessId: LOCATIONS[0].businessId,
      locationId: LOCATIONS[0].id,
      locationName: LOCATIONS[0].name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: 'Tratamiento de Keratina',
      specialistName: 'Emily Rodríguez',
      specialistId: 'SP001',
      startTime: new Date(tomorrow.getTime()).toISOString(),
      endTime: new Date(tomorrow.getTime() + 90 * 60 * 1000).toISOString(),
      estimatedDuration: 90, // 90 minutos - Tratamiento largo
      status: 'confirmed',
      resourceId: 'CAB001',
      notes: 'Primera cita del día - Tratamiento completo',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    
    // Cita 2: Usaquén (Norte) - 10:30 AM
    {
      PK: 'APPOINTMENT#APT-002',
      SK: 'APPOINTMENT#APT-002',
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 150 * 60 * 1000).toISOString()}`,
      GSI2PK: `LOCATION#${LOCATIONS[2].id}`,
      GSI2SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 150 * 60 * 1000).toISOString()}`,
      appointmentId: 'APT-002',
      businessId: LOCATIONS[2].businessId,
      locationId: LOCATIONS[2].id,
      locationName: LOCATIONS[2].name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: 'Corte y Peinado',
      specialistName: 'Carolina Pérez',
      specialistId: 'SP005',
      startTime: new Date(tomorrow.getTime() + 150 * 60 * 1000).toISOString(),
      endTime: new Date(tomorrow.getTime() + 210 * 60 * 1000).toISOString(),
      estimatedDuration: 60, // 60 minutos - Corte y peinado
      status: 'confirmed',
      resourceId: 'CAB006',
      notes: 'Desplazamiento al norte - 30 min aprox desde Chapinero',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    
    // Cita 3: Suba (Noroccidente) - 12:00 PM
    {
      PK: 'APPOINTMENT#APT-003',
      SK: 'APPOINTMENT#APT-003',
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 240 * 60 * 1000).toISOString()}`,
      GSI2PK: `LOCATION#${LOCATIONS[3].id}`,
      GSI2SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 240 * 60 * 1000).toISOString()}`,
      appointmentId: 'APT-003',
      businessId: LOCATIONS[3].businessId,
      locationId: LOCATIONS[3].id,
      locationName: LOCATIONS[3].name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: 'Manicure Express',
      specialistName: 'Diana Torres',
      specialistId: 'SP006',
      startTime: new Date(tomorrow.getTime() + 240 * 60 * 1000).toISOString(),
      endTime: new Date(tomorrow.getTime() + 285 * 60 * 1000).toISOString(),
      estimatedDuration: 45, // 45 minutos - Manicure express
      status: 'confirmed',
      resourceId: 'CAB009',
      notes: 'Cruzando hacia el occidente - 25 min desde Usaquén',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    
    // Cita 4: Kennedy (Sur-Occidente) - 1:30 PM
    {
      PK: 'APPOINTMENT#APT-004',
      SK: 'APPOINTMENT#APT-004',
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 330 * 60 * 1000).toISOString()}`,
      GSI2PK: `LOCATION#${LOCATIONS[4].id}`,
      GSI2SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 330 * 60 * 1000).toISOString()}`,
      appointmentId: 'APT-004',
      businessId: LOCATIONS[4].businessId,
      locationId: LOCATIONS[4].id,
      locationName: LOCATIONS[4].name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: 'Pedicure Spa',
      specialistName: 'Laura Gómez',
      specialistId: 'SP002',
      startTime: new Date(tomorrow.getTime() + 330 * 60 * 1000).toISOString(),
      endTime: new Date(tomorrow.getTime() + 390 * 60 * 1000).toISOString(),
      estimatedDuration: 60, // 60 minutos - Pedicure spa
      status: 'confirmed',
      resourceId: 'CAB011',
      notes: 'Desplazamiento largo hacia el sur - 35 min desde Suba',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    
    // Cita 5: Chía (Norte - fuera de Bogotá) - 3:30 PM
    {
      PK: 'APPOINTMENT#APT-005',
      SK: 'APPOINTMENT#APT-005',
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 450 * 60 * 1000).toISOString()}`,
      GSI2PK: `LOCATION#${LOCATIONS[1].id}`,
      GSI2SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 450 * 60 * 1000).toISOString()}`,
      appointmentId: 'APT-005',
      businessId: LOCATIONS[1].businessId,
      locationId: LOCATIONS[1].id,
      locationName: LOCATIONS[1].name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: 'Color y Highlights',
      specialistName: 'Andrea López',
      specialistId: 'SP004',
      startTime: new Date(tomorrow.getTime() + 450 * 60 * 1000).toISOString(),
      endTime: new Date(tomorrow.getTime() + 570 * 60 * 1000).toISOString(),
      estimatedDuration: 120, // 120 minutos - Color y highlights (tratamiento largo)
      status: 'confirmed',
      resourceId: 'CAB004',
      notes: 'Desplazamiento más largo del día - 50 min desde Kennedy hasta Chía',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    
    // Cita 6: Chapinero (Centro) - 6:00 PM - Regreso al punto inicial
    {
      PK: 'APPOINTMENT#APT-006',
      SK: 'APPOINTMENT#APT-006',
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 600 * 60 * 1000).toISOString()}`,
      GSI2PK: `LOCATION#${LOCATIONS[0].id}`,
      GSI2SK: `APPOINTMENT#${new Date(tomorrow.getTime() + 600 * 60 * 1000).toISOString()}`,
      appointmentId: 'APT-006',
      businessId: LOCATIONS[0].businessId,
      locationId: LOCATIONS[0].id,
      locationName: LOCATIONS[0].name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: 'Masaje Capilar',
      specialistName: 'Emily Rodríguez',
      specialistId: 'SP001',
      startTime: new Date(tomorrow.getTime() + 600 * 60 * 1000).toISOString(),
      endTime: new Date(tomorrow.getTime() + 630 * 60 * 1000).toISOString(),
      estimatedDuration: 30, // 30 minutos - Masaje capilar (servicio rápido)
      status: 'pending',
      resourceId: 'CAB002',
      notes: 'Regreso a Chapinero - 40 min desde Chía',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]

  for (const apt of appointments) {
    await createAppointment(apt)
    console.log(`✅ Created appointment: ${apt.serviceType} at ${apt.locationName}`)
    console.log(`   📅 Date: ${new Date(apt.startTime).toLocaleDateString()}`)
    console.log(`   ⏰ Time: ${new Date(apt.startTime).toLocaleTimeString()}\n`)
  }

  console.log('🎉 Appointments seed completed!')
  console.log(`📊 Summary:`)
  console.log(`   - ${appointments.length} appointments created`)
  console.log(`   - User: ${USER_ID}`)
  console.log(`   - Locations: ${new Set(appointments.map(a => a.locationId)).size} unique locations`)
  console.log(`   - Time span: ${new Date(appointments[0].startTime).toLocaleTimeString()} - ${new Date(appointments[appointments.length - 1].endTime).toLocaleTimeString()}`)
  console.log(`\n🚗 Travel Route Overview:`)
  console.log(`   1. Chapinero (Centro) → 2. Usaquén (Norte) → 3. Suba (Noroccidente)`)
  console.log(`   4. Kennedy (Sur-Occidente) → 5. Chía (Norte) → 6. Chapinero (Centro)`)
  console.log(`\n✅ El dashboard mostrará un mapa con 6 citas en 5 ubicaciones diferentes`)
  console.log(`📍 Las rutas mostrarán desplazamientos realistas por toda Bogotá y municipios cercanos`)
}

main()
  .then(() => {
    console.log('\n✅ Seed script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
