'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AuthenticatedApp from '../components/AuthenticatedApp'
import { createAppointment, type CreateAppointmentData } from '@/services/api/appointments'

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showPaymentStatus, setShowPaymentStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    const processBoldPayment = async () => {
      // Capturar parámetros de pago de Bold
      const boldOrderId = searchParams?.get('bold-order-id')
      const boldTxStatus = searchParams?.get('bold-tx-status')

      if (boldOrderId && boldTxStatus) {
        console.log('💳 Pago detectado:', { boldOrderId, boldTxStatus })
        
        if (boldTxStatus === 'approved' || boldTxStatus === 'APPROVED') {
          setShowPaymentStatus('success')
          
          // Leer información de la cita pendiente de localStorage
          const pendingPaymentStr = localStorage.getItem('pendingAppointmentPayment')
          
          if (pendingPaymentStr) {
            try {
              const pendingPayment = JSON.parse(pendingPaymentStr)
              console.log('📋 Cita pendiente encontrada:', pendingPayment)
              
              // Verificar que el orderId coincida
              if (pendingPayment.boldOrderId === boldOrderId) {
                console.log('✅ OrderId coincide, creando cita...')
                
                // Crear la cita en DynamoDB
                const appointmentData: CreateAppointmentData = {
                  ...pendingPayment.appointmentData,
                  notes: `Pago confirmado - Order ID: ${boldOrderId}${pendingPayment.appointmentData.notes ? '\n' + pendingPayment.appointmentData.notes : ''}`
                }
                
                const result = await createAppointment(appointmentData)
                
                console.log('✅ ✅ ✅ CITA CREADA EXITOSAMENTE:', {
                  appointmentId: result.appointmentId,
                  boldOrderId,
                  timestamp: new Date().toISOString()
                })
                
                // Limpiar localStorage
                localStorage.removeItem('pendingAppointmentPayment')
                
                // Redirigir a dashboard después de 2 segundos
                setTimeout(() => {
                  router.push('/dashboard')
                }, 2000)
              } else {
                console.error('❌ OrderId no coincide:', {
                  expected: pendingPayment.boldOrderId,
                  received: boldOrderId
                })
                
                // Redirigir a appointments
                setTimeout(() => {
                  router.push('/appointments')
                }, 3000)
              }
            } catch (error) {
              console.error('❌ Error al crear cita después del pago:', error)
              
              // Redirigir a appointments incluso si hay error
              setTimeout(() => {
                router.push('/appointments')
              }, 3000)
            }
          } else {
            console.log('⚠️ No se encontró información de cita pendiente en localStorage')
            
            // Notificar al componente que escucha (por si el modal todavía está abierto)
            window.postMessage(
              { type: 'BOLD_PAYMENT_SUCCESS', orderId: boldOrderId, status: boldTxStatus },
              window.location.origin
            )
            
            // Redirigir a appointments después de 3 segundos
            setTimeout(() => {
              router.push('/appointments')
            }, 3000)
          }
        } else {
          setShowPaymentStatus('error')
          
          // Limpiar localStorage en caso de error
          localStorage.removeItem('pendingAppointmentPayment')
          
          // Redirigir después de 5 segundos en caso de error
          setTimeout(() => {
            router.push('/appointments')
          }, 5000)
        }
      }
    }
    
    processBoldPayment()
  }, [searchParams, router])

  return (
    <>
      {/* Toast de confirmación de pago */}
      {showPaymentStatus === 'success' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-fade-in">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              ¡Pago exitoso!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu cita está siendo confirmada...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13a4ec] mx-auto"></div>
          </div>
        </div>
      )}

      {showPaymentStatus === 'error' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-fade-in">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Error en el pago
            </h2>
            <p className="text-gray-600 mb-4">
              No se pudo procesar tu pago. Por favor intenta nuevamente.
            </p>
            <button
              onClick={() => router.push('/appointments')}
              className="px-6 py-3 bg-[#13a4ec] text-white rounded-lg font-medium hover:bg-[#0f8fcd] transition-colors"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      )}

      <AuthenticatedApp />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f8]">
        <div className="animate-pulse text-[#13a4ec] text-lg">
          Loading...
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}