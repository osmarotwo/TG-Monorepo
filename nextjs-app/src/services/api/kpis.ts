/**
 * KPIs API Service
 * Consume endpoints del data-handler Lambda
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

export interface KPIMetric {
  value: number;
  target: number;
  calculatedAt: string;
}

export interface KPIsData {
  'no-show-rate'?: KPIMetric;
  'occupancy'?: KPIMetric;
  'avg-ticket'?: KPIMetric;
}

export interface KPIsResponse {
  locationId: string;
  period: string;
  kpis: KPIsData;
}

/**
 * Fetch KPIs for a specific location
 */
/**
 * Fetch KPIs for a specific location and period
 */
export async function fetchKpisByLocation(locationId: string, period?: string) {
  const token = localStorage.getItem('idToken')
  
  // locationId debe estar en el path, no como query param
  const url = new URL(`${API_BASE_URL}/api/kpis/${locationId}`)
  if (period) {
    url.searchParams.append('period', period)
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch KPIs: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.kpis || []
}

/**
 * Fetch and aggregate KPIs from multiple locations
 */
export async function fetchAggregatedKpis(locationIds: string[], period: string = 'current-month') {
  if (locationIds.length === 0) return null
  
  try {
    // Fetch KPIs for all locations in parallel
    const allKpisPromises = locationIds.map(id => fetchKpisByLocation(id, period))
    const allKpisResults = await Promise.all(allKpisPromises)
    
    // Flatten all KPIs
    const allKpis = allKpisResults.flat()
    
    if (allKpis.length === 0) return null
    
    // Aggregate metrics by type
    const aggregated: Record<string, { value: number, target: number, count: number }> = {}
    
    allKpis.forEach(kpi => {
      if (!aggregated[kpi.metricType]) {
        aggregated[kpi.metricType] = {
          value: 0,
          target: kpi.target || 0,
          count: 0
        }
      }
      aggregated[kpi.metricType].value += kpi.value
      aggregated[kpi.metricType].count += 1
    })
    
    // Calculate averages
    const result: Record<string, { value: number, target: number }> = {}
    Object.entries(aggregated).forEach(([metricType, data]) => {
      result[metricType] = {
        value: data.value / data.count,
        target: data.target
      }
    })
    
    return result
  } catch (error) {
    console.error('Error fetching aggregated KPIs:', error)
    return null
  }
}



/**
 * Helper: Get auth token from localStorage or sessionStorage
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  
  let token = localStorage.getItem('authToken');
  if (!token) {
    token = sessionStorage.getItem('authToken');
  }
  
  return token || '';
}
