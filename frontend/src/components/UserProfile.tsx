import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { UserStatistics } from './UserStatistics';

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Icon name="user" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Usuario no autenticado
          </h2>
          <p className="text-gray-600">Por favor inicia sesión para ver tu perfil.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Perfil de Usuario
          </h1>
          <p className="text-gray-600">
            Información completa de tu cuenta autenticada con Google
          </p>
        </div>

        {/* Información Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tarjeta de Perfil Principal */}
          <Card className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={user.picture}
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-blue-100"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center mt-2">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Icon name="check" className="w-3 h-3 mr-1" />
                      Email Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <Icon name="x" className="w-3 h-3 mr-1" />
                      Email No Verificado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID de Usuario</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    <span className="inline-flex items-center">
                      <Icon name="globe" className="w-4 h-4 mr-1" />
                      {user.provider === 'google' ? 'Google OAuth' : 'Manual'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Información de Sesión */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Sesión
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Icon name="shield" className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Estado de Autenticación
                  </span>
                </div>
                <span className="text-sm text-green-600 font-semibold">
                  ✅ Autenticado
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Icon name="clock" className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Sesión Iniciada
                  </span>
                </div>
                <span className="text-sm text-blue-600">
                  {new Date().toLocaleString('es-ES')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Icon name="key" className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">
                    Método de Autenticación
                  </span>
                </div>
                <span className="text-sm text-purple-600">
                  OAuth 2.0 (Redirect)
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Estadísticas adicionales */}
        <UserStatistics />

        {/* Datos Técnicos */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="settings" className="w-5 h-5 mr-2" />
            Datos Técnicos del Usuario
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700">
{JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </Card>

        {/* Datos del Token JWT (si está disponible) */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="file" className="w-5 h-5 mr-2" />
            Información de Token JWT
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Algoritmo</div>
                <div className="text-sm text-gray-900">RS256</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Tipo</div>
                <div className="text-sm text-gray-900">JWT</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Issuer</div>
                <div className="text-sm text-gray-900">accounts.google.com</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-1">Audience</div>
                <div className="text-sm text-gray-900 break-all">
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID || 'Client ID no configurado'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* LocalStorage Info */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="database" className="w-5 h-5 mr-2" />
            Datos en LocalStorage
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700">
{JSON.stringify(JSON.parse(localStorage.getItem('auth_user') || 'null'), null, 2)}
            </pre>
          </div>
        </Card>

        {/* Acciones */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="settings" className="w-5 h-5 mr-2" />
            Acciones de Cuenta
          </h3>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              <Icon name="refresh" className="w-4 h-4 mr-2" />
              Recargar Datos
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(user, null, 2));
                alert('Datos del usuario copiados al portapapeles');
              }}
            >
              <Icon name="copy" className="w-4 h-4 mr-2" />
              Copiar Datos
            </Button>
            
            <Button 
              variant="outline" 
              onClick={signOut}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Icon name="log-out" className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};