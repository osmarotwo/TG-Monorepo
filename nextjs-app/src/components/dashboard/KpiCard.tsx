import React from 'react';

interface KpiCardProps {
  label: string;
  value: number;
  target: number;
  unit?: '%' | 'currency' | 'number';
  format?: 'percentage' | 'currency' | 'number';
}

export default function KpiCard({ label, value, target, unit, format = 'number' }: KpiCardProps) {
  // Format value based on type
  const formatValue = (val: number): string => {
    if (format === 'percentage' || unit === '%') {
      return `${val}%`;
    } else if (format === 'currency' || unit === 'currency') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(val);
    } else {
      return val.toLocaleString('es-CO');
    }
  };
  
  // Calculate progress percentage
  const progress = Math.min((value / target) * 100, 100);
  
  // Determine status color
  const getStatusColor = () => {
    const percentage = (value / target) * 100;
    
    // For no-show-rate, lower is better
    if (label.toLowerCase().includes('no-show')) {
      if (value <= target) return 'text-green-600 bg-green-100';
      if (value <= target * 1.5) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    }
    
    // For other metrics, higher is better
    if (percentage >= 100) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getProgressBarColor = () => {
    const percentage = (value / target) * 100;
    
    if (label.toLowerCase().includes('no-show')) {
      if (value <= target) return 'bg-green-500';
      if (value <= target * 1.5) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const statusColor = getStatusColor();
  const progressBarColor = getProgressBarColor();
  
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
      {/* Label */}
      <h4 className="text-sm font-medium text-gray-600">
        {label}
      </h4>
      
      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${statusColor.split(' ')[0]}`}>
          {formatValue(value)}
        </span>
        <span className="text-sm text-gray-500">
          / {formatValue(target)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Actual</span>
          <span>Meta: {formatValue(target)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressBarColor} rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {value <= target ? (label.toLowerCase().includes('no-show') ? '✓ Dentro de meta' : '✗ Por debajo') : 
           (label.toLowerCase().includes('no-show') ? '✗ Por encima' : '✓ Sobre meta')}
        </span>
      </div>
    </div>
  );
}
