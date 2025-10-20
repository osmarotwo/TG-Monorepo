/**
 * Script para verificar el userId en DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const USERS_TABLE = process.env.USERS_TABLE || 'Users'

async function checkUser() {
  console.log('🔍 Buscando usuario con email: osmarotwo@gmail.com\n')

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': 'osmarotwo@gmail.com',
        },
      })
    )

    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0]
      console.log('✅ Usuario encontrado:')
      console.log('   - userId:', user.userId)
      console.log('   - email:', user.email)
      console.log('   - firstName:', user.firstName)
      console.log('   - lastName:', user.lastName)
      console.log('   - PK:', user.PK)
      console.log('   - SK:', user.SK)
      console.log('\n📋 Datos completos:', JSON.stringify(user, null, 2))
    } else {
      console.log('❌ No se encontró ningún usuario con ese email')
      console.log('\n🔍 Listando todos los usuarios...\n')
      
      const allUsers = await docClient.send(
        new ScanCommand({
          TableName: USERS_TABLE,
          Limit: 10,
        })
      )
      
      console.log('Usuarios encontrados:')
      allUsers.Items?.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`)
        console.log(`   userId: ${user.userId}`)
        console.log(`   PK: ${user.PK}`)
      })
    }
  } catch (error) {
    console.error('❌ Error consultando DynamoDB:', error)
  }
}

checkUser()
  .then(() => {
    console.log('\n✅ Consulta finalizada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
