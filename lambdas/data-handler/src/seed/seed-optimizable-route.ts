/**
 * Seed de ruta INEFICIENTE para testing de optimización
 * 
 * Este script:
 * 1. Elimina todas las citas existentes del usuario
 * 2. Crea 6 citas en un orden INEFICIENTE susceptible de optimización
 * 
 * Ruta INEFICIENTE creada (orden cruzado por toda la ciudad):
 * Chapinero → Chía → Kennedy → Usaquén → Suba → Chapinero
 * 
 * Ruta ÓPTIMA esperada (orden geográfico lógico):
 * Chapinero → Usaquén → Chía → Suba → Kennedy → Chapinero
 * 
 * Mejora esperada: ~35-45% reducción en tiempo/distancia
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'Appointments'
const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616' // osmarotwo@gmail.com (Valerie Sofia Martinez)

// IDs de las ubicaciones existentes (coordinadas reales de Bogotá)
const LOCATIONS = [
  { 
    id: 'LOC001', 
    name: 'Salón Aurora - Sede Chapinero', 
    businessId: 'BIZ001', 
    lat: 4.653, 
    lng: -74.057,
    zone: 'Centro' 
  },
  { 
    id: 'LOC002', 
    name: 'Salón Aurora - Sede Chía', 
    businessId: 'BIZ001', 
    lat: 4.862, 
    lng: -74.055,
    zone: 'Norte (fuera ciudad)' 
  },
  { 
    id: 'LOC003', 
    name: 'Salón Aurora - Sede Usaquén', 
    businessId: 'BIZ001', 
    lat: 4.701, 
    lng: -74.033,
    zone: 'Norte' 
  },
  { 
    id: 'LOC004', 
    name: 'Salón Aurora - Sede Suba', 
    businessId: 'BIZ001', 
    lat: 4.740, 
    lng: -74.091,
    zone: 'Noroccidente' 
  },
  { 
    id: 'LOC005', 
    name: 'Salón Aurora - Sede Kennedy', 
    businessId: 'BIZ001', 
    lat: 4.635, 
    lng: -74.155,
    zone: 'Sur-Occidente' 
  },
]

/**
 * Elimina todas las citas del usuario
 */
async function deleteExistingAppointments() {
  console.log('🗑️  Deleting existing appointments...\n')
  
  // Query todas las citas del usuario usando GSI1
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: APPOINTMENTS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: {
        ':userId': `USER#${USER_ID}`,
      },
    })
  )
  
  const appointments = queryResult.Items || []
  console.log(`Found ${appointments.length} appointments to delete`)
  
  // Eliminar cada cita
  for (const apt of appointments) {
    await docClient.send(
      new DeleteCommand({
        TableName: APPOINTMENTS_TABLE,
        Key: {
          PK: apt.PK,
          SK: apt.SK,
        },
      })
    )
    console.log(`   ❌ Deleted: ${apt.serviceType} at ${apt.locationName}`)
  }
  
  console.log(`\n✅ Deleted ${appointments.length} appointments\n`)
}

/**
 * Crea una cita
 */
async function createAppointment(data: any) {
  await docClient.send(
    new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: data,
    })
  )
}

async function main() {
  console.log('🌱 Starting OPTIMIZABLE ROUTE seed...\n')
  console.log('🎯 Goal: Create intentionally INEFFICIENT route for optimization testing\n')

  // PASO 1: Eliminar citas existentes
  await deleteExistingAppointments()

  // PASO 2: Crear 6 citas en orden INEFICIENTE
  const now = new Date()
  const CUSTOMER_NAME = 'Valerie Sofia Martinez'
  
  // Mañana a las 8:00 AM
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(8, 0, 0, 0)
  
  // ORDEN INEFICIENTE (cruzando toda la ciudad):
  // 1. Chapinero (Centro) - 8:00 AM
  // 2. Chía (Norte - fuera) - 11:00 AM    ⬆️ LEJOS (3h gap para permitir reordenamiento)
  // 3. Kennedy (Sur-Occ) - 2:00 PM       ⬇️ MUY LEJOS (sur) (3h gap)
  // 4. Usaquén (Norte) - 5:00 PM          ⬆️ DE VUELTA AL NORTE (3h gap)
  // 5. Suba (Noroccidente) - 7:00 PM      ↔️ LATERAL (2h gap)
  // 6. Chapinero (Centro) - 9:00 PM       ⬇️ REGRESO (2h gap)
  
  const inefficientRoute = [
    {
      location: LOCATIONS[0], // Chapinero (Centro)
      startOffset: 0, // 8:00 AM
      duration: 60,
      service: 'Corte y Peinado',
      specialist: 'Emily Rodríguez',
      notes: '🏁 INICIO: Chapinero (Centro)',
    },
    {
      location: LOCATIONS[1], // Chía (Norte - 23km desde Chapinero)
      startOffset: 180, // 11:00 AM (3h después)
      duration: 90,
      service: 'Tratamiento de Keratina',
      specialist: 'Andrea López',
      notes: '⚠️ INEFICIENTE: Salto al norte (23 km, ~40 min en tráfico)',
    },
    {
      location: LOCATIONS[4], // Kennedy (Sur - 35km desde Chía)
      startOffset: 360, // 2:00 PM (3h después)
      duration: 45,
      service: 'Manicure Express',
      specialist: 'Laura Gómez',
      notes: '⚠️ MUY INEFICIENTE: Cruce completo de ciudad (35 km, ~55 min)',
    },
    {
      location: LOCATIONS[2], // Usaquén (Norte - 22km desde Kennedy)
      startOffset: 540, // 5:00 PM (3h después)
      duration: 60,
      service: 'Color y Highlights',
      specialist: 'Carolina Pérez',
      notes: '⚠️ INEFICIENTE: Regreso al norte (22 km, ~45 min)',
    },
    {
      location: LOCATIONS[3], // Suba (Noroccidente - 8km desde Usaquén)
      startOffset: 660, // 7:00 PM (2h después)
      duration: 30,
      service: 'Pedicure Express',
      specialist: 'Diana Torres',
      notes: '⚠️ INEFICIENTE: Movimiento lateral (8 km, ~20 min)',
    },
    {
      location: LOCATIONS[0], // Chapinero (Centro - 12km desde Suba)
      startOffset: 780, // 9:00 PM (2h después)
      duration: 45,
      service: 'Masaje Capilar',
      specialist: 'Emily Rodríguez',
      notes: '🏁 FIN: Regreso a Chapinero (12 km, ~25 min)',
    },
  ]

  const appointments = inefficientRoute.map((apt, index) => {
    const startTime = new Date(tomorrow.getTime() + apt.startOffset * 60 * 1000)
    const endTime = new Date(startTime.getTime() + apt.duration * 60 * 1000)
    const appointmentId = `APT-OPT-${String(index + 1).padStart(3, '0')}`
    
    return {
      PK: `APPOINTMENT#${appointmentId}`,
      SK: `APPOINTMENT#${appointmentId}`,
      GSI1PK: `USER#${USER_ID}`,
      GSI1SK: `APPOINTMENT#${startTime.toISOString()}`,
      GSI2PK: `LOCATION#${apt.location.id}`,
      GSI2SK: `APPOINTMENT#${startTime.toISOString()}`,
      appointmentId,
      businessId: apt.location.businessId,
      locationId: apt.location.id,
      locationName: apt.location.name,
      userId: USER_ID,
      customerId: USER_ID,
      customerName: CUSTOMER_NAME,
      serviceType: apt.service,
      specialistName: apt.specialist,
      specialistId: `SP${String(index + 1).padStart(3, '0')}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      estimatedDuration: apt.duration,
      status: 'confirmed',
      resourceId: `CAB${String(index + 1).padStart(3, '0')}`,
      notes: apt.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
  })

  // Crear las citas
  for (const apt of appointments) {
    await createAppointment(apt)
    console.log(`✅ Created: ${apt.serviceType}`)
    console.log(`   📍 Location: ${apt.locationName}`)
    console.log(`   ⏰ Time: ${new Date(apt.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`)
    console.log(`   📝 ${apt.notes}\n`)
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 OPTIMIZABLE ROUTE SEED COMPLETED!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  console.log('📊 SUMMARY:')
  console.log(`   ✅ Created ${appointments.length} appointments`)
  console.log(`   👤 User: Valerie Sofia Martinez`)
  console.log(`   📅 Date: ${new Date(appointments[0].startTime).toLocaleDateString('es-CO')}`)
  console.log(`   ⏱️  Time span: ${new Date(appointments[0].startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointments[appointments.length - 1].endTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n`)
  
  console.log('🚗 INEFFICIENT ROUTE (Current Order):')
  console.log('   1. Chapinero (Centro)')
  console.log('   2. → Chía (Norte) ⚠️ 23 km')
  console.log('   3. → Kennedy (Sur-Occ) ⚠️ 35 km')
  console.log('   4. → Usaquén (Norte) ⚠️ 22 km')
  console.log('   5. → Suba (Noroccidente) ⚠️ 8 km')
  console.log('   6. → Chapinero (Centro) 12 km')
  console.log('   Total: ~100 km, ~3h de viaje\n')
  
  console.log('✅ OPTIMAL ROUTE (Expected After Optimization):')
  console.log('   1. Chapinero (Centro)')
  console.log('   2. → Usaquén (Norte) ✅ 6 km')
  console.log('   3. → Chía (Norte) ✅ 18 km')
  console.log('   4. → Suba (Noroccidente) ✅ 15 km')
  console.log('   5. → Kennedy (Sur-Occ) ✅ 20 km')
  console.log('   6. → Chapinero (Centro) ✅ 12 km')
  console.log('   Total: ~71 km, ~2h de viaje\n')
  
  console.log('🎯 EXPECTED IMPROVEMENT:')
  console.log('   ⏱️  Time saved: ~1 hour (~33%)')
  console.log('   📏 Distance saved: ~29 km (~29%)')
  console.log('   ✅ Route efficiency: Circular with minimal backtracking\n')
  
  console.log('📍 NEXT STEPS:')
  console.log('   1. Run: npm run dev (in nextjs-app)')
  console.log('   2. Go to: http://localhost:3000/dashboard')
  console.log('   3. ✨ RouteOptimizationCard should appear with suggestions')
  console.log('   4. 🧪 Verify that optimized route matches expected order above\n')
}

main()
  .then(() => {
    console.log('✅ Seed script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
