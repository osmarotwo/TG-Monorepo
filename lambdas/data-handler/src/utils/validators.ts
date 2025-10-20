/**
 * Validate appointment data
 */
export function validateAppointment(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.locationId) errors.push('locationId is required');
  if (!data.serviceType) errors.push('serviceType is required');
  if (!data.specialistId) errors.push('specialistId is required');
  if (!data.startTime) errors.push('startTime is required');
  if (!data.endTime) errors.push('endTime is required');

  // Validate date format
  if (data.startTime && isNaN(Date.parse(data.startTime))) {
    errors.push('startTime must be a valid ISO 8601 date');
  }
  if (data.endTime && isNaN(Date.parse(data.endTime))) {
    errors.push('endTime must be a valid ISO 8601 date');
  }

  // Validate status
  const validStatuses = ['confirmed', 'pending', 'cancelled', 'no-show', 'completed'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate business data
 */
export function validateBusiness(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name) errors.push('name is required');
  if (!data.industry) errors.push('industry is required');
  if (!data.ownerId) errors.push('ownerId is required');

  const validIndustries = ['beauty', 'restaurant', 'retail', 'logistics', 'banking'];
  if (data.industry && !validIndustries.includes(data.industry)) {
    errors.push(`industry must be one of: ${validIndustries.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate location data
 */
export function validateLocation(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name) errors.push('name is required');
  if (!data.businessId) errors.push('businessId is required');
  if (!data.address) errors.push('address is required');
  if (!data.city) errors.push('city is required');

  if (data.latitude !== undefined && (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90)) {
    errors.push('latitude must be a number between -90 and 90');
  }
  if (data.longitude !== undefined && (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180)) {
    errors.push('longitude must be a number between -180 and 180');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
