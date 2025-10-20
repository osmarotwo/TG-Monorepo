import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'

async function checkAppointments() {
  console.log('🔍 Consultando citas para usuario:', USER_ID)
  
  const result = await docClient.send(
    new QueryCommand({
      TableName: 'Appointments',
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${USER_ID}`,
      },
    })
  )

  console.log(`\n📊 Total de citas encontradas: ${result.Items?.length || 0}\n`)
  
  result.Items?.forEach((apt, index) => {
    console.log(`${index + 1}. ${apt.serviceType}`)
    console.log(`   📍 ${apt.locationName}`)
    console.log(`   📅 ${new Date(apt.startTime).toLocaleString()}`)
    console.log(`   🆔 ${apt.appointmentId}`)
  })
}

checkAppointments()
