'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import Navigation from '@/components/Navigation';
import AvailabilityConfig from '@/components/business/AvailabilityConfig';

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

  const handleSave = async (schedule: any) => {
    try {
      const { createAvailability } = await import('@/services/businessService');
      
      // Save availability configuration
      await createAvailability({
        businessId: user.userId,
        locationId: user.businessId || user.userId, // Use businessId if available, otherwise userId
        schedule,
        slotInterval: 30, // Default to 30 minutes
      });
      
      console.log('Schedule saved successfully');
    } catch (error) {
      console.error('Error saving schedule:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] pb-20 md:pb-8">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AvailabilityConfig 
          businessId={user.businessId}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
