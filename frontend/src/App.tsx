import { useState } from 'react'
import HolaMundo from '@/components/HolaMundo'
import './styles/App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚀 Frontend React App
          </h1>
          <p className="text-gray-600">
            Proyecto React.js con Vite y TypeScript
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Hola Mundo Component */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <HolaMundo />
            </div>

            {/* Interactive Counter */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Contador Interactivo
              </h2>
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-4">
                  Has hecho click {count} {count === 1 ? 'vez' : 'veces'}
                </p>
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  onClick={() => setCount((count) => count + 1)}
                >
                  Incrementar
                </button>
                {count > 0 && (
                  <button
                    className="ml-3 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                    onClick={() => setCount(0)}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Vite</h3>
              <p className="text-gray-600 text-sm">
                Build tool ultrarrápido para desarrollo
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl mb-3">⚛️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">React</h3>
              <p className="text-gray-600 text-sm">
                Librería moderna para UI interactivas
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Tailwind</h3>
              <p className="text-gray-600 text-sm">
                Framework CSS utility-first
              </p>
            </div>
          </div>

          {/* Ready for Design Integration */}
          <div className="mt-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎯 Listo para tus Diseños
            </h2>
            <p className="text-gray-700 mb-6">
              Este scaffold está preparado para integrar tus diseños personalizados.
              La arquitectura es escalable y moderna.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-600">
              <span>✅ TypeScript</span>
              <span>✅ Tailwind CSS</span>
              <span>✅ React Router</span>
              <span>✅ Vite</span>
              <span>✅ ESLint</span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500">
          <p>Monorepo AWS Full-Stack • React Frontend</p>
        </footer>
      </div>
    </div>
  )
}

export default App