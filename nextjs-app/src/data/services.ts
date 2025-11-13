/**
 * Servicios disponibles por negocio
 * NOTA: Esto es temporal. Los servicios vendrán de la API una vez se implemente
 * el módulo B2B donde cada comercio podrá crear sus propios servicios.
 */

export interface Service {
  serviceId: string
  businessId: string
  name: string
  nameEn: string
  category: string
  defaultDuration: number // en minutos
  description?: string
  basePrice?: number
  currency?: string
}

// Servicios por negocio
const SERVICES_BY_BUSINESS: Record<string, Service[]> = {
  'BIZ001': [ // Salón Aurora
    {
      serviceId: 'SRV-001',
      businessId: 'BIZ001',
      name: 'Corte de cabello',
      nameEn: 'Haircut',
      category: 'beauty',
      defaultDuration: 30,
      description: 'Corte de cabello profesional',
      basePrice: 35000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-002',
      businessId: 'BIZ001',
      name: 'Tinte completo',
      nameEn: 'Full hair coloring',
      category: 'beauty',
      defaultDuration: 90,
      description: 'Coloración de cabello completa',
      basePrice: 120000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-003',
      businessId: 'BIZ001',
      name: 'Keratina',
      nameEn: 'Keratin treatment',
      category: 'beauty',
      defaultDuration: 120,
      description: 'Tratamiento de keratina profesional',
      basePrice: 200000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-004',
      businessId: 'BIZ001',
      name: 'Manicure',
      nameEn: 'Manicure',
      category: 'beauty',
      defaultDuration: 45,
      description: 'Cuidado completo de manos y uñas',
      basePrice: 25000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-005',
      businessId: 'BIZ001',
      name: 'Pedicure',
      nameEn: 'Pedicure',
      category: 'beauty',
      defaultDuration: 60,
      description: 'Cuidado completo de pies y uñas',
      basePrice: 30000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-006',
      businessId: 'BIZ001',
      name: 'Balayage',
      nameEn: 'Balayage',
      category: 'beauty',
      defaultDuration: 150,
      description: 'Técnica de coloración balayage',
      basePrice: 180000,
      currency: 'COP'
    }
  ],
  'BIZ002': [ // Fitness Pro
    {
      serviceId: 'SRV-007',
      businessId: 'BIZ002',
      name: 'Entrenamiento personal',
      nameEn: 'Personal training',
      category: 'fitness',
      defaultDuration: 60,
      description: 'Sesión de entrenamiento personalizado',
      basePrice: 80000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-008',
      businessId: 'BIZ002',
      name: 'Clase de yoga',
      nameEn: 'Yoga class',
      category: 'fitness',
      defaultDuration: 60,
      description: 'Clase de yoga grupal',
      basePrice: 35000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-009',
      businessId: 'BIZ002',
      name: 'Clase de spinning',
      nameEn: 'Spinning class',
      category: 'fitness',
      defaultDuration: 45,
      description: 'Clase de ciclismo indoor',
      basePrice: 30000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-010',
      businessId: 'BIZ002',
      name: 'Clase de CrossFit',
      nameEn: 'CrossFit class',
      category: 'fitness',
      defaultDuration: 60,
      description: 'Entrenamiento funcional de alta intensidad',
      basePrice: 40000,
      currency: 'COP'
    }
  ],
  'BIZ003': [ // Dental Care
    {
      serviceId: 'SRV-011',
      businessId: 'BIZ003',
      name: 'Consulta odontológica',
      nameEn: 'Dental checkup',
      category: 'health',
      defaultDuration: 30,
      description: 'Consulta dental general',
      basePrice: 50000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-012',
      businessId: 'BIZ003',
      name: 'Limpieza dental',
      nameEn: 'Dental cleaning',
      category: 'health',
      defaultDuration: 45,
      description: 'Profilaxis dental profesional',
      basePrice: 80000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-013',
      businessId: 'BIZ003',
      name: 'Blanqueamiento dental',
      nameEn: 'Teeth whitening',
      category: 'health',
      defaultDuration: 60,
      description: 'Blanqueamiento dental profesional',
      basePrice: 300000,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-014',
      businessId: 'BIZ003',
      name: 'Resina dental',
      nameEn: 'Dental filling',
      category: 'health',
      defaultDuration: 45,
      description: 'Restauración con resina',
      basePrice: 120000,
      currency: 'COP'
    }
  ],
  'BIZ004': [ // Café Aroma
    {
      serviceId: 'SRV-015',
      businessId: 'BIZ004',
      name: 'Reserva mesa para 2',
      nameEn: 'Table for 2',
      category: 'food',
      defaultDuration: 90,
      description: 'Reserva de mesa para 2 personas',
      basePrice: 0,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-016',
      businessId: 'BIZ004',
      name: 'Reserva mesa para 4',
      nameEn: 'Table for 4',
      category: 'food',
      defaultDuration: 90,
      description: 'Reserva de mesa para 4 personas',
      basePrice: 0,
      currency: 'COP'
    },
    {
      serviceId: 'SRV-017',
      businessId: 'BIZ004',
      name: 'Reserva mesa para 6+',
      nameEn: 'Table for 6+',
      category: 'food',
      defaultDuration: 120,
      description: 'Reserva de mesa para grupos grandes',
      basePrice: 0,
      currency: 'COP'
    }
  ]
}

/**
 * Obtener servicios por businessId
 */
export function getServicesByBusiness(businessId: string): Service[] {
  return SERVICES_BY_BUSINESS[businessId] || []
}

/**
 * Obtener servicio por ID
 */
export function getServiceById(serviceId: string): Service | undefined {
  for (const services of Object.values(SERVICES_BY_BUSINESS)) {
    const service = services.find(s => s.serviceId === serviceId)
    if (service) return service
  }
  return undefined
}

/**
 * Obtener todos los servicios (para referencia)
 */
export function getAllServices(): Service[] {
  return Object.values(SERVICES_BY_BUSINESS).flat()
}
