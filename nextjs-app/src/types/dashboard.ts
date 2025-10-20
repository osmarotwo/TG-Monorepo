/**
 * Dashboard TypeScript types
 * Centralized type definitions for dashboard components
 */

import { Appointment } from '@/services/api/appointments';
import { Location } from '@/services/api/locations';
import { Business } from '@/services/api/businesses';
import { KPIsData } from '@/services/api/kpis';

export interface DashboardData {
  business: Business | null;
  locations: Location[];
  upcomingAppointments: Appointment[];
  kpis: KPIsData | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardStats {
  totalLocations: number;
  totalAppointments: number;
  upcomingCount: number;
  completedCount: number;
}

export type IndustryType = 'beauty' | 'restaurant' | 'retail' | 'logistics' | 'banking';

export interface IndustryFilter {
  value: IndustryType;
  label: string;
  icon: string;
}

export const INDUSTRY_FILTERS: IndustryFilter[] = [
  { value: 'beauty', label: 'Belleza', icon: '💇' },
  { value: 'restaurant', label: 'Restaurantes', icon: '🍽️' },
  { value: 'retail', label: 'Retail', icon: '🛍️' },
  { value: 'logistics', label: 'Logística', icon: '📦' },
  { value: 'banking', label: 'Banca', icon: '🏦' },
];
