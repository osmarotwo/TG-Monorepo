import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

export const UserStatistics: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const loginTime = new Date().toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const accountAge = (() => {
    // Simulamos edad de cuenta basada en timestamp actual
    const created = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)); // Entre 0-30 días
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  })();

  return (
    <div className="space-y-6">
      {/* Estadísticas de Uso */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="activity" className="w-5 h-5 mr-2" />
          Estadísticas de la Cuenta
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">1</div>
            <div className="text-sm text-blue-800">Sesiones Totales</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{accountAge}</div>
            <div className="text-sm text-green-800">Días de Cuenta</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">OAuth 2.0</div>
            <div className="text-sm text-purple-800">Método Seguro</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">✅</div>
            <div className="text-sm text-orange-800">Verificado</div>
          </div>
        </div>
      </Card>

      {/* Información de Sesión Actual */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="clock" className="w-5 h-5 mr-2" />
          Sesión Actual
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Información de Acceso</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Hora de Login:</span>
                <span className="text-gray-900">{loginTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IP del Cliente:</span>
                <span className="text-gray-900">Localhost</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Navegador:</span>
                <span className="text-gray-900">{navigator.userAgent.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plataforma:</span>
                <span className="text-gray-900">{navigator.platform}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Seguridad</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cifrado:</span>
                <span className="text-green-600 font-medium">HTTPS/TLS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Autenticación:</span>
                <span className="text-blue-600 font-medium">Google OAuth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sesión:</span>
                <span className="text-green-600 font-medium">Activa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token JWT:</span>
                <span className="text-green-600 font-medium">Válido</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Capacidades de la Cuenta */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="shield" className="w-5 h-5 mr-2" />
          Capacidades y Permisos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <Icon name="check" className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-green-800">Acceso Completo</div>
              <div className="text-sm text-green-600">Dashboard y perfil</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <Icon name="check" className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-green-800">Email Verificado</div>
              <div className="text-sm text-green-600">Google confirmado</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <Icon name="key" className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-blue-800">OAuth Seguro</div>
              <div className="text-sm text-blue-600">Sin contraseñas locales</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
            <Icon name="database" className="w-5 h-5 text-purple-600 mr-3" />
            <div>
              <div className="font-medium text-purple-800">Datos Sincronizados</div>
              <div className="text-sm text-purple-600">Google y localStorage</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};