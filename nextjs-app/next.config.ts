import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para AWS Amplify
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Asegurar compatibilidad con Amplify
  distDir: 'out',
  // Opcional: deshabilitar funciones del servidor si solo queremos estático
  // experimental: {
  //   appDir: true
  // }
};

export default nextConfig;
