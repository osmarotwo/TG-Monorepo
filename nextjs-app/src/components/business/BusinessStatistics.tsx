'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Calendar, DollarSign, MapPin, TrendingUp, Users, Clock } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Appointment {
  appointmentId: string;
  businessId: string;
  locationId: string;
  locationName: string;
  servicePrice: number;
  serviceCurrency: string;
  status: string;
  appointmentDate: string;
  createdAt: string;
}

interface LocationStats {
  locationId: string;
  locationName: string;
  totalAppointments: number;
  confirmedAppointments: number;
  occupancyRate: number;
}

interface BusinessStatisticsProps {
  businessId: string;
}

export default function BusinessStatistics({ businessId }: BusinessStatisticsProps) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [confirmedAppointments, setConfirmedAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);

  const getLocationName = (locationId: string): string => {
    const locationMap: Record<string, string> = {
      'LOC001': 'Salón Aurora - Chapinero',
      'LOC002': 'Salón Aurora - Chía',
      'LOC003': 'Salón Aurora - Usaquén',
      'LOC004': 'Salón Aurora - Suba',
      'LOC005': 'Salón Aurora - Kennedy',
    };
    return locationMap[locationId] || locationId;
  };

  const getDefaultPrice = (serviceType: string): number => {
    const priceMap: Record<string, number> = {
      'Corte de cabello': 30000,
      'Tinte completo': 80000,
      'Keratina': 120000,
      'Manicure': 25000,
      'Pedicure': 30000,
      'Balayage': 150000,
      'Color': 80000,
      'Mechas': 100000,
    };
    return priceMap[serviceType] || 50000; // Precio por defecto
  };

  useEffect(() => {
    const fetchBusinessStats = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching business stats for:', businessId);
      
      if (!businessId || businessId === 'undefined' || businessId === 'null') {
        console.warn('⚠️ Invalid businessId, skipping fetch');
        setLoading(false);
        return;
      }
      
      // Import the business service
      const { getBusinessAppointments } = await import('@/services/businessService');
      
      // Fetch real appointments from API
      const fetchedAppointments = await getBusinessAppointments(businessId);
      console.log('✅ Fetched appointments:', fetchedAppointments.length);
      console.log('📋 First appointment:', fetchedAppointments[0]);
      
      // Transform to component format with location name mapping
      const transformedAppointments: Appointment[] = fetchedAppointments.map(apt => {
        // Usar servicePrice del registro, o calcular desde serviceType si no existe
        const price = apt.servicePrice || getDefaultPrice(apt.serviceType || apt.serviceName || '');
        
        return {
          appointmentId: apt.appointmentId,
          businessId: apt.businessId,
          locationId: apt.locationId,
          locationName: getLocationName(apt.locationId),
          servicePrice: price,
          serviceCurrency: apt.serviceCurrency || 'COP',
          status: apt.status,
          appointmentDate: apt.appointmentDate,
          createdAt: apt.createdAt,
        };
      });

      console.log('🔄 Transformed appointments:', transformedAppointments.length);
      console.log('💵 Appointments by location:', transformedAppointments.reduce((acc, apt) => {
        if (!acc[apt.locationId]) acc[apt.locationId] = [];
        acc[apt.locationId].push({
          id: apt.appointmentId,
          status: apt.status,
          price: apt.servicePrice,
          location: apt.locationName
        });
        return acc;
      }, {} as any));
      setAppointments(transformedAppointments);
      calculateStatistics(transformedAppointments);
    } catch (error) {
      console.error('❌ Error fetching business statistics:', error);
      
      // Set empty appointments array on error
      setAppointments([]);
      calculateStatistics([]);
    } finally {
      setLoading(false);
    }
    };

    // Solo ejecutar si hay businessId válido
    if (businessId && businessId !== 'undefined' && businessId !== 'null') {
      console.log('🎯 BusinessId changed, fetching stats:', businessId);
      fetchBusinessStats();
    } else {
      console.log('⏳ Waiting for valid businessId, current:', businessId);
      setLoading(false);
    }
  }, [businessId]);

  const calculateStatistics = (appts: Appointment[]) => {
    // Total appointments
    setTotalAppointments(appts.length);

    // Confirmed and pending
    const confirmed = appts.filter(a => a.status === 'confirmed').length;
    const pending = appts.filter(a => a.status === 'pending').length;
    setConfirmedAppointments(confirmed);
    setPendingAppointments(pending);

    // Calculate revenue (20% of deposits)
    const revenue = appts
      .filter(a => a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.servicePrice * 0.20), 0);
    setTotalRevenue(revenue);

    // Initialize all 5 Aurora locations
    const allLocations: LocationStats[] = [
      { locationId: 'LOC001', locationName: 'Salón Aurora - Chapinero', totalAppointments: 0, confirmedAppointments: 0, occupancyRate: 0 },
      { locationId: 'LOC002', locationName: 'Salón Aurora - Chía', totalAppointments: 0, confirmedAppointments: 0, occupancyRate: 0 },
      { locationId: 'LOC003', locationName: 'Salón Aurora - Usaquén', totalAppointments: 0, confirmedAppointments: 0, occupancyRate: 0 },
      { locationId: 'LOC004', locationName: 'Salón Aurora - Suba', totalAppointments: 0, confirmedAppointments: 0, occupancyRate: 0 },
      { locationId: 'LOC005', locationName: 'Salón Aurora - Kennedy', totalAppointments: 0, confirmedAppointments: 0, occupancyRate: 0 },
    ];

    // Calculate location statistics
    const locationMap = new Map<string, LocationStats>();
    
    // Initialize map with all locations
    allLocations.forEach(loc => {
      locationMap.set(loc.locationId, { ...loc });
    });
    
    // Update with actual appointment data
    appts.forEach(apt => {
      const existing = locationMap.get(apt.locationId);
      if (existing) {
        existing.totalAppointments++;
        if (apt.status === 'confirmed') {
          existing.confirmedAppointments++;
        }
      }
    });

    // Calculate occupancy rate (confirmed / total * 100)
    const stats = Array.from(locationMap.values()).map(stat => ({
      ...stat,
      occupancyRate: stat.totalAppointments > 0 
        ? (stat.confirmedAppointments / stat.totalAppointments) * 100 
        : 0,
    }));

    // Count active locations (locations with appointments)
    const activeLocations = stats.filter(s => s.totalAppointments > 0).length;

    setLocationStats(stats);
    console.log('📊 Statistics calculated:', { 
      totalAppointments: appts.length, 
      confirmed, 
      pending, 
      revenue,
      activeLocations,
      stats 
    });
  };

  // Calculate appointments over time (last 6 days)
  const getAppointmentsOverTime = () => {
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : `Hace ${i} días`;
      labels.push(label);

      // Count confirmed appointments created on this day
      const count = appointments.filter(apt => {
        const aptDate = new Date(apt.createdAt);
        return apt.status === 'confirmed' &&
               aptDate.getDate() === date.getDate() &&
               aptDate.getMonth() === date.getMonth() &&
               aptDate.getFullYear() === date.getFullYear();
      }).length;
      
      data.push(count);
    }

    return { labels, data };
  };

  const timeData = getAppointmentsOverTime();

  // Chart configurations
  const appointmentsOverTimeData = {
    labels: timeData.labels,
    datasets: [
      {
        label: 'Citas Confirmadas',
        data: timeData.data,
        borderColor: '#13a4ec',
        backgroundColor: 'rgba(19, 164, 236, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Filter to only show locations with appointments
  const activeLocationStats = locationStats.filter(stat => stat.totalAppointments > 0);

  const locationOccupancyData = {
    labels: activeLocationStats.map(stat => stat.locationName),
    datasets: [
      {
        label: 'Ocupación (%)',
        data: activeLocationStats.map(stat => stat.occupancyRate),
        backgroundColor: '#13a4ec',
        borderColor: '#0f8fcd',
        borderWidth: 1,
      },
    ],
  };

  const revenueByLocationData = {
    labels: activeLocationStats.map(stat => stat.locationName),
    datasets: [
      {
        label: 'Ingresos (20% depósitos)',
        data: activeLocationStats.map(stat => {
          const locationAppointments = appointments.filter(
            a => a.locationId === stat.locationId && a.status === 'confirmed'
          );
          const revenue = locationAppointments.reduce((sum, a) => sum + (a.servicePrice * 0.20), 0);
          console.log(`💰 Revenue for ${stat.locationName}:`, {
            locationId: stat.locationId,
            appointments: locationAppointments.length,
            prices: locationAppointments.map(a => a.servicePrice),
            revenue
          });
          return revenue;
        }),
        backgroundColor: [
          'rgba(19, 164, 236, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Citas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalAppointments}</p>
              <p className="text-xs text-gray-400 mt-1">
                {confirmedAppointments} confirmadas, {pendingAppointments} pendientes
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-[#13a4ec]" />
            </div>
          </div>
        </div>

        {/* Confirmed Rate */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tasa Confirmación</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalAppointments > 0 
                  ? Math.round((confirmedAppointments / totalAppointments) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {confirmedAppointments} de {totalAppointments} citas
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ingresos (20%)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${totalRevenue.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                De {confirmedAppointments} citas confirmadas
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Active Locations */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sedes Activas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {locationStats.filter(s => s.totalAppointments > 0).length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Con citas registradas
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Over Time */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#13a4ec]" />
            Citas en el Tiempo
          </h3>
          <div className="h-64">
            <Line data={appointmentsOverTimeData} options={chartOptions} />
          </div>
        </div>

        {/* Location Occupancy */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-[#13a4ec]" />
            Ocupación por Sede
          </h3>
          <div className="h-64">
            <Bar data={locationOccupancyData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue by Location */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-[#13a4ec]" />
            Ingresos por Sede
          </h3>
          <div className="h-64">
            <Doughnut data={revenueByLocationData} options={doughnutOptions} />
          </div>
        </div>

        {/* Location Details Table */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-[#13a4ec]" />
            Detalle por Sede
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Sede
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Citas
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Ocupación
                  </th>
                </tr>
              </thead>
              <tbody>
                {locationStats
                  .filter(stat => stat.totalAppointments > 0)
                  .map((stat) => (
                    <tr key={stat.locationId} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-900">{stat.locationName}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {stat.confirmedAppointments}/{stat.totalAppointments}
                      </td>
                      <td className="py-3 text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stat.occupancyRate >= 80
                            ? 'bg-green-100 text-green-800'
                            : stat.occupancyRate >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {stat.occupancyRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
