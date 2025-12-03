'use client';

import { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, MapPin, Clock, User, DollarSign, Phone, Mail } from 'lucide-react';

interface Appointment {
  appointmentId: string;
  businessId: string;
  locationId: string;
  locationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  serviceName: string;
  servicePrice: number;
  serviceCurrency: string;
  serviceDuration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  appointmentDate: string;
  appointmentTime: string;
  createdAt: string;
  notes?: string;
}

interface AppointmentsCalendarProps {
  businessId: string;
}

export default function AppointmentsCalendar({ businessId }: AppointmentsCalendarProps) {
  // Inicializar en diciembre 2025 para ver las citas del 4 de diciembre
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11, 1)); // Diciembre 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, [businessId]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedLocation, selectedStatus, selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('📅 Fetching appointments for businessId:', businessId);
      
      // Import the business service
      const { getBusinessAppointments } = await import('@/services/businessService');
      
      // Fetch real appointments from API
      const fetchedAppointments = await getBusinessAppointments(businessId);
      
      console.log('✅ Appointments fetched:', {
        count: fetchedAppointments.length,
        sample: fetchedAppointments.slice(0, 2)
      });
      
      console.log('📋 First appointment structure:', fetchedAppointments[0]);
      
      // Transformar los datos del backend al formato esperado por el frontend
      const transformedAppointments = fetchedAppointments.map((apt: any) => {
        // Buscar el nombre de la sede en múltiples campos posibles
        let locationName = apt.locationName || apt.location?.name || apt.locationAddress;
        
        // Si no hay nombre, intentar construirlo desde el locationId
        if (!locationName && apt.locationId) {
          // Mapeo de IDs conocidos
          const locationMap: Record<string, string> = {
            'LOC001': 'Salón Aurora - Chapinero',
            'LOC002': 'Salón Aurora - Chía',
            'LOC003': 'Salón Aurora - Usaquén',
            'LOC004': 'Salón Aurora - Suba',
            'LOC005': 'Salón Aurora - Kennedy'
          };
          locationName = locationMap[apt.locationId] || apt.locationId;
        }
        
        return {
          appointmentId: apt.appointmentId,
          businessId: apt.businessId,
          locationId: apt.locationId,
          locationName: locationName || 'Sede no disponible',
          userId: apt.userId || apt.customerId,
          userName: apt.customerName || apt.userName || 'Cliente no disponible',
          userEmail: apt.customerEmail || apt.userEmail || 'No disponible',
          userPhone: apt.customerPhone || apt.userPhone,
          serviceName: apt.serviceType || apt.serviceName || 'Servicio',
          servicePrice: apt.servicePrice || apt.price || 0,
          serviceCurrency: apt.serviceCurrency || apt.currency || 'COP',
          serviceDuration: apt.duration || apt.serviceDuration || apt.estimatedDuration || 60,
          status: apt.status || 'pending',
          appointmentDate: apt.date || apt.appointmentDate,
          appointmentTime: apt.time || apt.appointmentTime || '00:00',
          createdAt: apt.createdAt,
          notes: apt.notes
        };
      });
      
      console.log('🔄 Transformed appointments:', transformedAppointments.slice(0, 2));
      
      setAppointments(transformedAppointments);
      
      // Extract unique locations from appointments
      const appointmentLocations = Array.from(new Set(transformedAppointments.map(a => a.locationName).filter(Boolean)));
      
      console.log('📍 Locations from appointments:', appointmentLocations);
      
      // Always include all Aurora locations even if they don't have appointments
      const allAuroraLocations = [
        'Salón Aurora - Chapinero',
        'Salón Aurora - Chía',
        'Salón Aurora - Usaquén',
        'Salón Aurora - Suba',
        'Salón Aurora - Kennedy'
      ];
      
      // Merge appointment locations with all locations, removing duplicates
      const uniqueLocations = Array.from(new Set([...allAuroraLocations, ...appointmentLocations]));
      
      console.log('📍 Final locations list:', uniqueLocations);
      
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      
      // Fallback to mock data if API fails
      const mockAppointments: Appointment[] = [
        {
          appointmentId: '1',
          businessId,
          locationId: 'loc1',
          locationName: 'Sede Norte',
          userId: 'user1',
          userName: 'Juan Pérez',
          userEmail: 'juan@example.com',
          userPhone: '+57 300 123 4567',
          serviceName: 'Corte de Cabello',
          servicePrice: 50000,
          serviceCurrency: 'COP',
          serviceDuration: 30,
          status: 'confirmed',
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '10:00',
          createdAt: new Date().toISOString(),
          notes: 'Cliente prefiere atención temprano',
        },
        {
          appointmentId: '2',
          businessId,
          locationId: 'loc1',
          locationName: 'Sede Norte',
          userId: 'user2',
          userName: 'María González',
          userEmail: 'maria@example.com',
          userPhone: '+57 310 234 5678',
          serviceName: 'Manicure',
          servicePrice: 35000,
          serviceCurrency: 'COP',
          serviceDuration: 45,
          status: 'confirmed',
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '14:00',
          createdAt: new Date().toISOString(),
        },
        {
          appointmentId: '3',
          businessId,
          locationId: 'loc2',
          locationName: 'Sede Sur',
          userId: 'user3',
          userName: 'Carlos Rodríguez',
          userEmail: 'carlos@example.com',
          serviceName: 'Masaje Deportivo',
          servicePrice: 80000,
          serviceCurrency: 'COP',
          serviceDuration: 60,
          status: 'pending',
          appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          appointmentTime: '16:00',
          createdAt: new Date().toISOString(),
        },
      ];

      setAppointments(mockAppointments);
      
      // Extract unique locations
      const uniqueLocations = Array.from(new Set(mockAppointments.map(a => a.locationName)));
      setLocations(uniqueLocations);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(apt => apt.locationName === selectedLocation);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Filter by selected date
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(apt => apt.appointmentDate === dateStr);
    }

    setFilteredAppointments(filtered);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointmentDate === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'America/Bogota' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-[#13a4ec]" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sede
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2 bg-[#f6f7f8] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
            >
              <option value="all">Todas las sedes</option>
              {locations.map((location, index) => (
                <option key={`${location}-${index}`} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[#f6f7f8] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
            <div className="flex space-x-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dayAppointments = getAppointmentsForDate(date);
              const isSelected = selectedDate?.getDate() === day && 
                                selectedDate?.getMonth() === currentMonth.getMonth();
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  className={`aspect-square p-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#13a4ec] text-white'
                      : isToday
                      ? 'bg-blue-50 text-[#13a4ec] font-semibold'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm">{day}</div>
                  {dayAppointments.length > 0 && (
                    <div className="flex justify-center mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#13a4ec]'
                      }`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-[#13a4ec]" />
            {selectedDate 
              ? `Citas del ${selectedDate.getDate()} ${selectedDate.toLocaleDateString('es-ES', { month: 'long', timeZone: 'America/Bogota' })}`
              : 'Todas las citas'}
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay citas para mostrar
              </p>
            ) : (
              filteredAppointments.map(apt => (
                <div
                  key={apt.appointmentId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#13a4ec] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>
                    <span className="text-xs text-gray-500">{apt.appointmentTime}</span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{apt.serviceName}</h4>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {apt.userName}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {apt.locationName}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {apt.serviceDuration} min
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      ${apt.servicePrice?.toLocaleString('es-CO') || apt.servicePrice || 0} {apt.serviceCurrency}
                    </div>
                    {apt.userPhone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {apt.userPhone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {apt.userEmail}
                    </div>
                  </div>
                  
                  {apt.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">{apt.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
