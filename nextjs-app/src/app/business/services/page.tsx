'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import Navigation from '@/components/Navigation';

export default function BusinessServicesPage() {
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

  return (
    <div className="min-h-screen bg-[#f6f7f8] pb-20 md:pb-8">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('navigation.servicesPricing', 'navigation')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure your services and pricing
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Services & Pricing</h2>
            <p className="text-gray-600 mb-4">
              This feature is coming soon. You'll be able to configure your services, pricing, and durations.
            </p>
            <span className="inline-block px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
