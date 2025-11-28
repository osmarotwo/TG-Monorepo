'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import Navigation from '@/components/Navigation';

export default function BusinessAvailabilityPage() {
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
            {t('navigation.availability', 'navigation')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your business hours and availability
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Availability</h2>
            <p className="text-gray-600 mb-4">
              This feature is coming soon. You'll be able to set your business hours and manage availability.
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
