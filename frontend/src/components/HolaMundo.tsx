import React from 'react'

const HolaMundo: React.FC = () => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        👋 ¡Hola Mundo!
      </h2>
      <p className="text-gray-600 mb-6">
        Este es tu primer componente React en el nuevo frontend.
      </p>
      
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-4">
        <p className="text-purple-800 font-medium">
          🎉 ¡El scaffold de React está listo!
        </p>
      </div>

      <div className="space-y-2 text-sm text-gray-500">
        <p>✅ Vite configurado</p>
        <p>✅ TypeScript activo</p>
        <p>✅ Tailwind CSS funcionando</p>
        <p>✅ Estructura escalable creada</p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm font-medium">
          💡 Tip: Ahora puedes integrar tus diseños personalizados
        </p>
        <p className="text-blue-600 text-xs mt-1">
          Modifica este componente o crea nuevos en src/components/
        </p>
      </div>
    </div>
  )
}

export default HolaMundo