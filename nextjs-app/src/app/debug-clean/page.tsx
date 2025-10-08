'use client';

import { useLocale } from '@/contexts/LocaleContext';

export default function DebugCleanPage() {
  const { t, locale, setLocale } = useLocale();

  // Clear localStorage and reset
  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const testKeys = [
    { key: 'fullName', section: 'auth' },
    { key: 'email', section: 'auth' },
    { key: 'password', section: 'auth' },
    { key: 'confirmPassword', section: 'auth' },
    { key: 'createAccount', section: 'auth' },
    { key: 'signIn', section: 'auth' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Clean - Traducciones</h1>
        
        <div className="mb-6">
          <p className="mb-2">Idioma actual: <strong>{locale}</strong></p>
          <div className="space-x-4 mb-4">
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
            <button 
              onClick={clearStorage}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas de Traducción (Auth)</h2>
          <div className="space-y-4">
            {testKeys.map(({ key, section }) => (
              <div key={`${section}.${key}`} className="border-b pb-2">
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-mono text-sm text-gray-600">{section}.{key}</span>
                  <span className="font-medium">{t(key, section)}</span>
                  <span className="text-sm text-gray-500">
                    Función: t('{key}', '{section}')
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p>Locale: {locale}</p>
          <p>localStorage: {typeof window !== 'undefined' ? localStorage.getItem('locale') : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}