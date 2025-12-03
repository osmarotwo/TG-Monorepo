'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import Navigation from '@/components/Navigation';
import BusinessStatistics from '@/components/business/BusinessStatistics';

export default function BusinessDashboard() {
  const { user, status } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered');
    console.log('   Status:', status);
    console.log('   User email:', user?.email);
    console.log('   BusinessId:', user?.businessId);
    console.log('   UserId:', user?.userId);
    
    if (status === 'loading') {
      console.log('   ⏳ Status is loading, waiting...');
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('   🔒 Unauthenticated, redirecting to login...');
      router.push('/business/auth/login');
      return;
    }
    
    // Marcar que el usuario está usando el dashboard business
    if (user) {
      console.log('   ✅ User loaded, setting lastDashboard');
      localStorage.setItem('lastDashboard', 'business');
    }
    
    // Redirect non-business users to customer dashboard
    // Solo redirigir si explícitamente es 'customer', no si es undefined
    if (user && user.profileType === 'customer' && !user.role?.includes('business')) {
      console.log('⚠️ Usuario tipo customer intentando acceder a dashboard business, redirigiendo...');
      localStorage.removeItem('lastDashboard');
      router.push('/dashboard');
    }
  }, [status, user, router]);

  // Logging detallado del render
  console.log('🎨 Dashboard RENDER:', {
    status,
    hasUser: !!user,
    userEmail: user?.email,
    businessId: user?.businessId,
    userId: user?.userId,
    willUseBusinessId: user?.businessId || user?.userId
  });

  // Esperar hasta que el status no sea loading Y tengamos un user válido
  if (status === 'loading' || !user) {
    console.log('⏳ Showing loading spinner - status:', status, 'hasUser:', !!user);
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    );
  }

  // Extraer businessId
  const businessId = user.businessId || user.userId;
  
  // Si aún no hay businessId, seguir mostrando loading
  if (!businessId || businessId === 'undefined') {
    console.log('⏳ Waiting for businessId... current:', businessId);
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    );
  }
  
  console.log('✅ Rendering dashboard with businessId:', businessId);

  return (
    <div className="min-h-screen bg-[#f6f7f8] pb-20 md:pb-8">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Negocio
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Estadísticas y métricas de tu negocio
          </p>
        </div>

        {/* Business Statistics Component - Solo renderizar cuando tenemos businessId */}
        {businessId && <BusinessStatistics key={businessId} businessId={businessId} />}
      </div>
    </div>
  );
}
