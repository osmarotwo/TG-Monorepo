'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AuthenticatedApp from '../components/AuthenticatedApp'

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showPaymentStatus, setShowPaymentStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    // Capturar parámetros de pago de Bold
    const boldOrderId = searchParams?.get('bold-order-id')
    const boldTxStatus = searchParams?.get('bold-tx-status')

    if (boldOrderId && boldTxStatus) {
      console.log('💳 Pago detectado:', { boldOrderId, boldTxStatus })
      
      if (boldTxStatus === 'approved' || boldTxStatus === 'APPROVED') {
        setShowPaymentStatus('success')
        
        // Notificar al componente que escucha para crear la cita
        window.postMessage(
          { type: 'BOLD_PAYMENT_SUCCESS', orderId: boldOrderId, status: boldTxStatus },
          window.location.origin
        )
        
        // Redirigir a appointments después de 3 segundos
        setTimeout(() => {
          router.push('/appointments')
        }, 3000)
      } else {
        setShowPaymentStatus('error')
        
        // Redirigir después de 5 segundos en caso de error
        setTimeout(() => {
          router.push('/appointments')
        }, 5000)
      }
    }
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