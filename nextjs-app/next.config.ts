import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para AWS Amplify con soporte de API Routes
  // NO usar 'export' porque necesitamos API routes (server-side)
  images: {
    unoptimized: true
  },
  // trailingSlash removido para evitar conflictos con API routes
  // Amplify manejará el SSR automáticamente
};

export default nextConfig;
