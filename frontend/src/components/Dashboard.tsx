import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBrandConfig } from '../utils/brandConfig';
import { Button, Card, Logo, Icon } from './ui';
import { UserProfile } from './UserProfile';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { platform } = useBrandConfig();
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');

  if (!user) return null;

  // Si está en vista de perfil, mostrar UserProfile
  if (currentView === 'profile') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-10">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center"
          >
            <Icon name="arrow-left" className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
        <UserProfile />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            ¡Bienvenido a {platform.name}!
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            Tu registro se completó exitosamente
          </p>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <div className="flex items-center mt-2 space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.provider === 'google' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                }`}>
                  {user.provider === 'google' ? '🔗 Google' : '📧 Email'}
                </span>
                {user.emailVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    ✓ Verificado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Button 
            variant="primary" 
            fullWidth
            onClick={() => setCurrentView('profile')}
          >
            <Icon name="user" className="w-4 h-4 mr-2" />
            Ver Perfil Completo
          </Button>
          <Button variant="outline" fullWidth>
            <Icon name="settings" className="w-4 h-4 mr-2" />
            Configuración
          </Button>
          <Button variant="outline" fullWidth onClick={signOut}>
            <Icon name="log-out" className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats/Info */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Citas Agendadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">1</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Perfil Completado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Notificaciones</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gracias por unirte a {platform.name}. ¡Esperamos que tengas una excelente experiencia!
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;