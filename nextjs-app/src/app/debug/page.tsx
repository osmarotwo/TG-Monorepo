'use client';

import { useLocale } from '@/contexts/LocaleContext';

export default function DebugPage() {
  const { t, locale, setLocale } = useLocale();

  const testKeys = [
    { key: 'fullName', section: 'auth' },
    { key: 'email', section: 'auth' },
    { key: 'password', section: 'auth' },
    { key: 'confirmPassword', section: 'auth' },
    { key: 'createAccount', section: 'auth' },
    { key: 'signIn', section: 'auth' },
    { key: 'verifyingEmail', section: 'verification' },
    { key: 'emailVerified', section: 'verification' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Traducciones</h1>
        
        <div className="mb-6">
          <p className="mb-2">Idioma actual: <strong>{locale}</strong></p>
          <div className="space-x-4">
            <button 
              onClick={() => setLocale('es')}
              className={`px-4 py-2 rounded ${locale === 'es' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
            >
              Español
            </button>
            <button 
              onClick={() => setLocale('en')}
              className={`px-4 py-2 rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
            >
              English
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas de Traducción</h2>
          <div className="space-y-4">
            {testKeys.map(({ key, section }) => (
              <div key={`${section}.${key}`} className="border-b pb-2">
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-mono text-sm text-gray-600">{section}.{key}</span>
                  <span className="font-medium">{t(key, section)}</span>
                  <span className="text-sm text-gray-500">
                    Función: t(&apos;{key}&apos;, &apos;{section}&apos;)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas con Sintaxis Punto</h2>
          <div className="space-y-4">
            <div className="border-b pb-2">
              <div className="grid grid-cols-3 gap-4">
                <span className="font-mono text-sm text-gray-600">auth.fullName</span>
                <span className="font-medium">{t('auth.fullName')}</span>
                <span className="text-sm text-gray-500">
                  Función: t(&apos;auth.fullName&apos;)
                </span>
              </div>
            </div>
            <div className="border-b pb-2">
              <div className="grid grid-cols-3 gap-4">
                <span className="font-mono text-sm text-gray-600">auth.email</span>
                <span className="font-medium">{t('auth.email')}</span>
                <span className="text-sm text-gray-500">
                  Función: t(&apos;auth.email&apos;)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}