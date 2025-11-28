'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useLocale } from '@/contexts/LocaleContext'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    // Bold redirige con estos parámetros después del pago
    const orderId = searchParams?.get('orderId') || searchParams?.get('bold-order-id')
    const txStatus = searchParams?.get('tx-status') || searchParams?.get('bold-tx-status') || searchParams?.get('status')

    console.log('💳 Payment callback received:', { 
      orderId, 
      txStatus,
      allParams: Object.fromEntries(searchParams?.entries() || []) 
    })

    if (txStatus === 'approved' || txStatus === 'APPROVED') {
      setStatus('success')
      
      // Notificar al modal (si se abrió en ventana emergente)
      if (window.opener && !window.opener.closed) {
        console.log('📤 Sending success message to parent window...')
        window.opener.postMessage(
          { type: 'BOLD_PAYMENT_SUCCESS', orderId, txStatus },
          window.location.origin
        )
      }
      
      // También notificar al padre si se abrió en iframe/embedded (modo alternativo)
      if (window.parent && window.parent !== window) {
        console.log('📤 Sending success message to parent frame...')
        window.parent.postMessage(
          { type: 'BOLD_PAYMENT_SUCCESS', orderId, txStatus },
          window.location.origin
        )
      }
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        // Si hay window.opener, cerramos esta ventana
        if (window.opener && !window.opener.closed) {
          window.close()
        } else {
          router.push('/appointments')
        }
      }, 3000)
    } else if (txStatus === 'declined' || txStatus === 'DECLINED' || txStatus === 'failed' || txStatus === 'FAILED') {
      setStatus('error')
    } else {
      // Si no hay status aún, puede estar en proceso
      console.log('⏳ Payment status pending or unknown...')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#13a4ec] mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {locale === 'es' ? 'Procesando pago...' : 'Processing payment...'}
            </h2>
            <p className="text-gray-600">
              {locale === 'es' 
                ? 'Por favor espera mientras confirmamos tu pago.' 
                : 'Please wait while we confirm your payment.'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              {locale === 'es' ? '¡Pago exitoso!' : 'Payment successful!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {locale === 'es' 
                ? 'Tu cita ha sido confirmada. Serás redirigido en breve...' 
                : 'Your appointment has been confirmed. You will be redirected shortly...'}
            </p>
            <div className="animate-pulse text-[#13a4ec]">
              {locale === 'es' ? 'Redirigiendo...' : 'Redirecting...'}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {locale === 'es' ? 'Error en el pago' : 'Payment error'}
            </h2>
            <p className="text-gray-600 mb-6">
              {locale === 'es' 
                ? 'Hubo un problema al procesar tu pago. Por favor intenta nuevamente.' 
                : 'There was a problem processing your payment. Please try again.'}
            </p>
            <button
              onClick={() => router.push('/appointments')}
              className="px-6 py-3 bg-[#13a4ec] text-white rounded-lg font-medium hover:bg-[#0f8fcd] transition-colors"
            >
              {locale === 'es' ? 'Volver a citas' : 'Back to appointments'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
