'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import Navigation from '@/components/Navigation';
import locationService, { Location, CreateLocationData } from '@/services/locationService';

export default function BusinessLocationsPage() {
  const { user, status } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateLocationData>({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    phone: '',
    email: '',
    hours: locationService.getDefaultBusinessHours(),
    isPrimary: false,
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/business/auth/login');
      return;
    }
    
    // Redirect non-business users to customer dashboard
    if (user && user.profileType !== 'business' && !user.role?.includes('business')) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadLocations();
    }
  }, [status, user, router]);

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const businessId = user?.businessId || user?.userId;
      
      console.log('🔍 Loading locations for business:', {
        businessId,
        userId: user?.userId,
        userBusinessId: user?.businessId,
        userEmail: user?.email,
        profileType: user?.profileType,
        role: user?.role
      });
      
      const response = await locationService.getLocations(businessId);
      
      console.log('📍 Locations loaded:', {
        count: response.locations.length,
        locations: response.locations.map(l => ({ id: l.locationId, name: l.name, businessId: l.businessId }))
      });
      
      setLocations(response.locations);
    } catch (error: any) {
      console.error('❌ Error loading locations:', error);
      setError(error.message || 'Error al cargar las sedes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        coordinates: location.coordinates,
        phone: location.phone || '',
        email: location.email || '',
        hours: location.hours || locationService.getDefaultBusinessHours(),
        isPrimary: location.isPrimary || false,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
        phone: '',
        email: '',
        hours: locationService.getDefaultBusinessHours(),
        isPrimary: false,
      });
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.locationId, formData);
        setSuccessMessage('Sede actualizada exitosamente');
      } else {
        await locationService.createLocation(formData);
        setSuccessMessage('Sede creada exitosamente');
      }
      
      handleCloseModal();
      await loadLocations();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Error al guardar la sede');
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sede?')) {
      return;
    }

    try {
      await locationService.deleteLocation(locationId);
      setSuccessMessage('Sede eliminada exitosamente');
      await loadLocations();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la sede');
    }
  };

  if (!user || isLoading) {
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('navigation.manageLocations', 'navigation')}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Agrega y administra las sedes de tu negocio
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#13a4ec] hover:bg-[#0f8fcd] text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Agregar Sede
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-[#13a4ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay sedes todavía</h2>
              <p className="text-gray-600 mb-4">
                {!user?.businessId 
                  ? 'Tu cuenta de usuario necesita estar vinculada a un negocio. Por favor contacta a soporte.'
                  : 'Comienza agregando la primera sede de tu negocio.'}
              </p>
              {user?.businessId && (
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar tu Primera Sede
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div
                key={location.locationId}
                className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {location.name}
                      {location.isPrimary && (
                        <span className="ml-2 text-xs bg-[#13a4ec] text-white px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(location)}
                      className="text-gray-400 hover:text-[#13a4ec] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(location.locationId)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{locationService.formatAddress(location.address)}</span>
                  </div>

                  {location.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{location.phone}</span>
                    </div>
                  )}

                  {location.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{location.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingLocation ? 'Editar Sede' : 'Agregar Nueva Sede'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Location Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Nombre de la Sede *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                      placeholder="Oficina Principal"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Dirección *</h3>
                    
                    <input
                      type="text"
                      required
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                      placeholder="Calle y número"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                        className="px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                        placeholder="Ciudad"
                      />
                      <input
                        type="text"
                        required
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value }
                        })}
                        className="px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                        placeholder="Departamento"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zipCode: e.target.value }
                        })}
                        className="px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                        placeholder="Código Postal"
                      />
                      <input
                        type="text"
                        required
                        value={formData.address.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, country: e.target.value }
                        })}
                        className="px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                        placeholder="País"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Número de Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-[#f6f7f8] border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                        placeholder="sede@negocio.com"
                      />
                    </div>
                  </div>

                  {/* Primary Location */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="w-4 h-4 text-[#13a4ec] border-gray-300 rounded focus:ring-[#13a4ec]"
                    />
                    <label htmlFor="isPrimary" className="text-sm font-medium text-gray-900">
                      Establecer como sede principal
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white rounded-xl font-medium transition-colors"
                    >
                      {editingLocation ? 'Actualizar Sede' : 'Agregar Sede'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
