import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon } from './ui/Icon';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
}

export const ProfileCompletion: React.FC = () => {
  const { user, completeProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    birthDate: ''
  });

  const validateStep1 = () => {
    const newErrors: Partial<ProfileData> = {};
    
    if (!profileData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<ProfileData> = {};
    
    if (!profileData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(profileData.phone)) {
      newErrors.phone = 'El teléfono debe tener al menos 10 dígitos';
    }
    
    if (!profileData.birthDate) {
      newErrors.birthDate = 'La fecha de nacimiento es obligatoria';
    } else {
      const birthDate = new Date(profileData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        newErrors.birthDate = 'Debes tener al menos 13 años';
      } else if (age > 120) {
        newErrors.birthDate = 'Por favor ingresa una fecha válida';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await completeProfile(profileData);
    } catch (error) {
      console.error('Error completing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Icon name="user" className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Completa tu perfil
          </h1>
          <p className="text-gray-600">
            Necesitamos algunos datos adicionales para completar tu registro
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Paso {currentStep} de 2
            </span>
            <span className="text-sm text-gray-500">
              {currentStep === 1 ? 'Información básica' : 'Información personal'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <Input
                type="text"
                value={profileData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ingresa tu nombre completo"
                error={errors.fullName}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico *
              </label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                error={errors.email}
                className="w-full"
              />
              {user?.provider === 'google' && (
                <p className="text-xs text-gray-500 mt-1">
                  Pre-rellenado desde tu cuenta de Google
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de teléfono *
              </label>
              <Input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                error={errors.phone}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de nacimiento *
              </label>
              <Input
                type="date"
                value={profileData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                error={errors.birthDate}
                className="w-full"
                max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex-1"
            >
              <Icon name="arrow-left" className="w-4 h-4 mr-2" />
              Anterior
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {currentStep === 2 ? (
              loading ? 'Completando...' : 'Completar perfil'
            ) : (
              <>
                Siguiente
                <Icon name="arrow-right" className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Todos los campos marcados con * son obligatorios
          </p>
        </div>
      </Card>
    </div>
  );
};