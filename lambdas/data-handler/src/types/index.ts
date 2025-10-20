// TypeScript interfaces for Clyok Dashboard data models

export interface Appointment {
  appointmentId: string;
  businessId: string;
  locationId: string;
  userId: string; // Administrador que gestiona
  customerId: string;
  customerName: string;
  serviceType: string;
  specialistName: string;
  specialistId: string;
  startTime: string; // ISO 8601
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'no-show' | 'completed';
  resourceId: string; // Cabina/silla/mesa asignada
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  businessId: string;
  name: string;
  industry: 'beauty' | 'restaurant' | 'retail' | 'logistics' | 'banking';
  ownerId: string;
  logoUrl?: string;
  description?: string;
  totalLocations: number;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  locationId: string;
  businessId: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  imageUrl?: string;
  resources: Resource[];
  specialists: Specialist[];
  operatingHours?: Record<string, any>;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'cabin' | 'chair' | 'table' | 'room';
}

export interface Specialist {
  id: string;
  name: string;
  specialties: string[];
}

export interface KPI {
  locationId: string;
  period: string; // "2025-10-16", "2025-10"
  metricType: 'no-show-rate' | 'occupancy' | 'avg-ticket';
  value: number;
  target: number;
  calculatedAt: string;
}

// DynamoDB item structure
export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  [key: string]: any;
}
