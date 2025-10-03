import React, { useState } from 'react';
import { useBrandConfig } from '../utils/brandConfig';
import { Button, Input, Card, Logo } from './ui';

interface FormData {
  name: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export const RegistrationForm: React.FC = () => {
  const { content } = useBrandConfig();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Validación de formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'La contraseña no cumple los requisitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica de registro real
      console.log('Registration data:', formData);
      alert('¡Registro exitoso!');
      
      // Limpiar formulario
      setFormData({ name: '', email: '', password: '' });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error en el registro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro con Google
  const handleGoogleSignup = () => {
    console.log('Google signup clicked');
    alert('Funcionalidad de Google pendiente de implementar');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            {content.registration.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {content.registration.subtitle}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            required
          />

          {/* Email */}
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          {/* Contraseña */}
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            helperText={content.registration.passwordRequirements}
            required
          />

          {/* Botón de registro */}
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {content.registration.submitText}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card-light dark:bg-card-dark text-gray-500 dark:text-gray-400">
                {content.registration.alternativeText}
              </span>
            </div>
          </div>
        </div>

        {/* Google Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            fullWidth
            leftIcon="google"
            onClick={handleGoogleSignup}
            type="button"
          >
            Registrarse con Google
          </Button>
        </div>

        {/* Link a login */}
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes una cuenta?{' '}
          <button 
            type="button"
            className="font-medium text-primary hover:text-primary/90 transition-colors"
            onClick={() => alert('Navegar a login')}
          >
            {content.registration.loginLinkText}
          </button>
        </p>
      </Card>
    </div>
  );
};

export default RegistrationForm;