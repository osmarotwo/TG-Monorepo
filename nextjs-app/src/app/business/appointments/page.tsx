'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import Navigation from '@/components/Navigation';
import AppointmentsCalendar from '@/components/business/AppointmentsCalendar';

export default function BusinessAppointmentsPage() {
  const { user, status } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' || status === 'loading') {
      if (status === 'unauthenticated') {
        router.push('/business/auth/login');
      }
      return;
    }
    
    if (user && user.profileType !== 'business') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    );
  }

  const businessId = user?.businessId || user?.userId;

  return (
    <div className="min-h-screen bg-[#f6f7f8] pb-20 md:pb-8">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Agenda de Citas
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Visualiza y gestiona todas las citas de tu negocio
          </p>
        </div>

        <AppointmentsCalendar businessId={businessId} />
      </div>
    </div>
  );
}
